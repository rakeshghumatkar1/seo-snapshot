import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'
import { generateAnonymizedSampleContent } from '@/lib/anonymize/generateAnonymizedSample'
import {
  runDeterministicPrivacyScan,
  scanSectionsForIdentifiers,
} from '@/lib/anonymize/privacyScan'
import {
  resolveExpectedKeysFromReport,
  validateAnonymizedStructure,
} from '@/lib/anonymize/structure'
import {
  ensureHomepageShowcaseSchema,
  ensureUniqueSlug,
  getPublicSampleBySlug,
  getShowcaseByReportId,
  publishAnonymizedSample,
  saveAnonymizedDraft,
  setAnonymizationStatus,
  slugifyDisplayName,
  unpublishAnonymizedSample,
  upsertAnonymizedShowcaseMeta,
} from '@/lib/db/homepageShowcase'
import { normalizeDomain } from '@/lib/url/normalizeDomain'

export const maxDuration = 120
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function loadReport(reportId: string) {
  const rows = await dbQuery(
    `SELECT id, website_url, report_type, created_at, status, sections_json
     FROM reports
     WHERE id = $1
     LIMIT 1`,
    [reportId]
  )
  return rows[0] || null
}

function publicSafePreview(row: any, report: any) {
  const sections =
    row?.anonymized_sections_json && typeof row.anonymized_sections_json === 'object'
      ? row.anonymized_sections_json
      : null
  return {
    slug: row?.slug || null,
    displayName: row?.public_display_name || null,
    businessCategory: row?.business_category || null,
    publicLocation: row?.public_location || null,
    reportType: report.report_type === 'detailed' ? 'detailed' : 'snapshot',
    reportVersion: row?.anonymized_report_version || null,
    generatedAt: report.created_at || null,
    sections,
    sampleContentMode: 'anonymized' as const,
    anonymizationStatus: row?.anonymization_status || 'none',
    audit: row?.anonymization_audit_json || null,
    featured: Boolean(row?.featured),
    displayOrder: Number(row?.display_order || 0),
    useAsSample: Boolean(row?.use_as_sample),
    isActive: Boolean(row?.is_active),
    showDomain: false,
    domain: null,
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureHomepageShowcaseSchema()
    const reportId = req.nextUrl.searchParams.get('reportId') || ''
    if (!UUID_RE.test(reportId)) {
      return NextResponse.json({ error: 'Valid reportId is required' }, { status: 400 })
    }

    const report = await loadReport(reportId)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const showcase = await getShowcaseByReportId(reportId)
    let publicVisible = false
    let slugRowCount = 0
    if (showcase?.slug) {
      const publicRow = await getPublicSampleBySlug(String(showcase.slug))
      publicVisible = Boolean(publicRow)
      const slugRows = await dbQuery(
        `SELECT id, report_id, use_as_sample, anonymization_status, sample_content_mode, updated_at
         FROM homepage_showcase
         WHERE slug = $1
         ORDER BY updated_at DESC`,
        [String(showcase.slug)]
      )
      slugRowCount = slugRows.length
      return NextResponse.json({
        report: {
          id: report.id,
          website_url: report.website_url,
          report_type: report.report_type,
          created_at: report.created_at,
          status: report.status,
        },
        showcase: showcase || null,
        preview: showcase ? publicSafePreview(showcase, report) : null,
        diagnostics: {
          publicVisible,
          slugRowCount,
          slugRows: slugRows.map((r: any) => ({
            id: r.id,
            report_id: r.report_id,
            use_as_sample: r.use_as_sample,
            anonymization_status: r.anonymization_status,
            sample_content_mode: r.sample_content_mode,
            updated_at: r.updated_at,
          })),
        },
      })
    }

    return NextResponse.json({
      report: {
        id: report.id,
        website_url: report.website_url,
        report_type: report.report_type,
        created_at: report.created_at,
        status: report.status,
      },
      showcase: showcase || null,
      preview: showcase ? publicSafePreview(showcase, report) : null,
      diagnostics: { publicVisible, slugRowCount, slugRows: [] },
    })
  } catch (err) {
    console.error('[Admin/anonymize GET]', err)
    return NextResponse.json({ error: 'Failed to load anonymised sample' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureHomepageShowcaseSchema()
    const body = await req.json()
    const action = String(body.action || '').trim()
    const reportId = typeof body.reportId === 'string' ? body.reportId : ''
    if (!UUID_RE.test(reportId)) {
      return NextResponse.json({ error: 'Valid reportId is required' }, { status: 400 })
    }

    const report = await loadReport(reportId)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    if (String(report.status || 'success') !== 'success') {
      return NextResponse.json({ error: 'Only successful reports can be anonymised' }, { status: 400 })
    }

    const reportType = report.report_type === 'detailed' ? 'detailed' : 'snapshot'
    const existing = await getShowcaseByReportId(reportId)

    if (action === 'save_meta') {
      const publicDisplayName = String(body.genericLabel || body.publicDisplayName || '').trim().slice(0, 120)
      const businessCategory = String(body.businessCategory || '').trim().slice(0, 80) || null
      const publicLocation = String(body.publicLocation || '').trim().slice(0, 120) || null
      if (!publicDisplayName) {
        return NextResponse.json({ error: 'Generic company label is required' }, { status: 400 })
      }
      const requestedSlug = String(body.slug || publicDisplayName).trim()
      const slug = await ensureUniqueSlug(requestedSlug || slugifyDisplayName(publicDisplayName), reportId)
      const featured = Boolean(body.featured)
      const displayOrder = Number.isFinite(Number(body.displayOrder))
        ? Math.max(0, Math.min(9999, Number(body.displayOrder)))
        : 0

      const row = await upsertAnonymizedShowcaseMeta({
        reportId,
        slug,
        publicDisplayName,
        businessCategory,
        publicLocation,
        featured,
        displayOrder,
        isActive: true,
      })
      return NextResponse.json({ success: true, showcase: row, preview: publicSafePreview(row, report) })
    }

    if (action === 'generate') {
      if (existing?.anonymization_status === 'generating') {
        return NextResponse.json(
          { error: 'Anonymisation already in progress for this report' },
          { status: 409 }
        )
      }

      const publicDisplayName = String(
        body.genericLabel || body.publicDisplayName || existing?.public_display_name || ''
      )
        .trim()
        .slice(0, 120)
      const businessCategory = String(
        body.businessCategory || existing?.business_category || ''
      )
        .trim()
        .slice(0, 80)
      const publicLocation = String(
        body.publicLocation || existing?.public_location || ''
      )
        .trim()
        .slice(0, 120)

      if (!publicDisplayName || !businessCategory || !publicLocation) {
        return NextResponse.json(
          { error: 'Generic company label, business category, and public location are required' },
          { status: 400 }
        )
      }

      const requestedSlug = String(body.slug || existing?.slug || publicDisplayName).trim()
      const slug = await ensureUniqueSlug(
        requestedSlug || slugifyDisplayName(publicDisplayName),
        reportId
      )
      const featured = Boolean(body.featured ?? existing?.featured)
      const displayOrder = Number.isFinite(Number(body.displayOrder ?? existing?.display_order))
        ? Math.max(0, Math.min(9999, Number(body.displayOrder ?? existing?.display_order ?? 0)))
        : 0

      await upsertAnonymizedShowcaseMeta({
        reportId,
        slug,
        publicDisplayName,
        businessCategory,
        publicLocation,
        featured,
        displayOrder,
        isActive: true,
      })
      await setAnonymizationStatus(reportId, 'generating')

      const sectionsJson =
        typeof report.sections_json === 'object' && report.sections_json
          ? (report.sections_json as Record<string, unknown>)
          : {}
      const resolved = resolveExpectedKeysFromReport(sectionsJson, reportType)
      if (!resolved.keys.length) {
        await setAnonymizationStatus(reportId, 'failed')
        return NextResponse.json({ error: 'Source report has no sections' }, { status: 400 })
      }

      const result = await generateAnonymizedSampleContent({
        genericLabel: publicDisplayName,
        businessCategory,
        publicLocation,
        reportType,
        expectedKeys: resolved.keys,
        sourceSections: resolved.sourceSections,
        websiteUrl: report.website_url,
        originalDomain: normalizeDomain(report.website_url),
      })

      if (!result.sections) {
        await setAnonymizationStatus(reportId, 'failed')
        return NextResponse.json(
          {
            success: false,
            error:
              result.error ||
              'Could not generate anonymised sample. Your source report was not changed.',
            status: 'failed',
            aiCalls: result.aiCalls,
          },
          { status: 422 }
        )
      }

      const saved = await saveAnonymizedDraft({
        reportId,
        sections: result.sections,
        reportVersion: resolved.version,
        status: result.status,
        audit: {
          deterministicPassed: result.deterministicPassed,
          audit: result.audit,
          aiCalls: result.aiCalls,
          error: result.error || null,
        },
      })

      console.log('[AnonymizedSample] Draft saved')
      return NextResponse.json({
        success: true,
        status: result.status,
        privacyCheck:
          result.status === 'ready'
            ? 'Passed'
            : result.status === 'needs_review'
              ? 'Needs Review'
              : 'Failed',
        showcase: saved,
        preview: publicSafePreview(saved, report),
        audit: result.audit,
        deterministicPassed: result.deterministicPassed,
        aiCalls: result.aiCalls,
      })
    }

    if (action === 'save_sections') {
      if (!existing || existing.sample_content_mode !== 'anonymized') {
        return NextResponse.json({ error: 'No anonymised draft exists' }, { status: 404 })
      }
      const sectionsJson =
        typeof report.sections_json === 'object' && report.sections_json
          ? (report.sections_json as Record<string, unknown>)
          : {}
      const resolved = resolveExpectedKeysFromReport(sectionsJson, reportType)
      const incoming =
        body.sections && typeof body.sections === 'object'
          ? (body.sections as Record<string, unknown>)
          : null
      const validation = validateAnonymizedStructure(
        { sections: incoming },
        resolved.keys,
        resolved.sourceSections
      )
      if (!validation.valid || !validation.sections) {
        return NextResponse.json(
          { error: 'Invalid section payload', details: validation.errors },
          { status: 400 }
        )
      }

      const scan = runDeterministicPrivacyScan(validation.sections, report.website_url)
      const residual = scanSectionsForIdentifiers(scan.cleanedSections, report.website_url)
      const status = residual.length ? 'needs_review' : 'ready'
      const saved = await saveAnonymizedDraft({
        reportId,
        sections: scan.cleanedSections,
        reportVersion: resolved.version,
        status,
        audit: {
          deterministicPassed: residual.length === 0,
          residual,
          note: 'manual_edit',
        },
      })

      return NextResponse.json({
        success: true,
        status,
        privacyCheck: residual.length ? 'Needs Review' : 'Passed',
        residual,
        showcase: saved,
        preview: publicSafePreview(saved, report),
      })
    }

    if (action === 'publish') {
      // Flush latest metadata from the drawer before publish gates
      const flushLabel = String(
        body.genericLabel || body.publicDisplayName || existing?.public_display_name || ''
      )
        .trim()
        .slice(0, 120)
      if (flushLabel) {
        const flushCategory =
          String(body.businessCategory || existing?.business_category || '').trim().slice(0, 80) ||
          null
        const flushLocation =
          String(body.publicLocation || existing?.public_location || '').trim().slice(0, 120) || null
        const flushSlug = await ensureUniqueSlug(
          String(body.slug || existing?.slug || flushLabel).trim() ||
            slugifyDisplayName(flushLabel),
          reportId
        )
        await upsertAnonymizedShowcaseMeta({
          reportId,
          slug: flushSlug,
          publicDisplayName: flushLabel,
          businessCategory: flushCategory,
          publicLocation: flushLocation,
          featured: Boolean(body.featured ?? existing?.featured),
          displayOrder: Number.isFinite(Number(body.displayOrder ?? existing?.display_order))
            ? Math.max(0, Math.min(9999, Number(body.displayOrder ?? existing?.display_order ?? 0)))
            : 0,
          isActive: true,
        })
      }

      const sectionsJson =
        typeof report.sections_json === 'object' && report.sections_json
          ? (report.sections_json as Record<string, unknown>)
          : {}
      const resolved = resolveExpectedKeysFromReport(sectionsJson, reportType)

      // Flush pending section edits from the drawer (deterministic privacy only — no AI)
      if (body.sections && typeof body.sections === 'object') {
        const validationIncoming = validateAnonymizedStructure(
          { sections: body.sections },
          resolved.keys,
          resolved.sourceSections
        )
        if (!validationIncoming.valid || !validationIncoming.sections) {
          return NextResponse.json(
            {
              error: 'Cannot publish yet. Section structure is invalid.',
              details: validationIncoming.errors,
            },
            { status: 400 }
          )
        }
        const scan = runDeterministicPrivacyScan(
          validationIncoming.sections,
          report.website_url
        )
        const residualFlush = scanSectionsForIdentifiers(
          scan.cleanedSections,
          report.website_url
        )
        if (residualFlush.length) {
          await saveAnonymizedDraft({
            reportId,
            sections: scan.cleanedSections,
            reportVersion: resolved.version,
            status: 'needs_review',
            audit: {
              deterministicPassed: false,
              residual: residualFlush,
              note: 'publish_flush',
            },
          })
          return NextResponse.json(
            {
              error: 'Cannot publish yet. Privacy check found identifying information.',
              residual: residualFlush,
              privacyCheck: 'Needs Review',
            },
            { status: 400 }
          )
        }
        await saveAnonymizedDraft({
          reportId,
          sections: scan.cleanedSections,
          reportVersion: resolved.version,
          status: 'ready',
          audit: {
            deterministicPassed: true,
            residual: [],
            note: 'publish_flush',
          },
        })
      }

      const row = await getShowcaseByReportId(reportId)
      if (!row || row.sample_content_mode !== 'anonymized') {
        return NextResponse.json({ error: 'Anonymised sample draft not found' }, { status: 404 })
      }
      if (!row.public_display_name?.trim() || !row.slug?.trim()) {
        return NextResponse.json(
          { error: 'Generic company label and slug are required before publish' },
          { status: 400 }
        )
      }
      if (!row.anonymized_sections_json || typeof row.anonymized_sections_json !== 'object') {
        return NextResponse.json({ error: 'Anonymised sections are missing' }, { status: 400 })
      }
      if (row.anonymization_status === 'failed') {
        return NextResponse.json({ error: 'Cannot publish a failed anonymisation' }, { status: 400 })
      }
      if (row.anonymization_status === 'needs_review') {
        return NextResponse.json(
          {
            error: 'Cannot publish yet. Privacy check found identifying information.',
            privacyCheck: 'Needs Review',
          },
          { status: 400 }
        )
      }
      if (!['ready', 'draft', 'published'].includes(String(row.anonymization_status))) {
        return NextResponse.json(
          { error: 'Anonymised sample is not ready to publish' },
          { status: 400 }
        )
      }

      const validation = validateAnonymizedStructure(
        { sections: row.anonymized_sections_json },
        resolved.keys,
        resolved.sourceSections
      )
      if (!validation.valid || !validation.sections) {
        return NextResponse.json(
          { error: 'Structural validation failed', details: validation.errors },
          { status: 400 }
        )
      }

      const residual = scanSectionsForIdentifiers(validation.sections, report.website_url)
      if (residual.length) {
        return NextResponse.json(
          {
            error: 'Cannot publish yet. Privacy check found identifying information.',
            residual,
            privacyCheck: 'Needs Review',
          },
          { status: 400 }
        )
      }

      // Persist prose normalisation (and promote draft → ready) before publish
      await saveAnonymizedDraft({
        reportId,
        sections: validation.sections,
        reportVersion: resolved.version,
        status: 'ready',
        audit:
          row.anonymization_audit_json ||
          {
            note:
              row.anonymization_status === 'draft'
                ? 'promoted_draft_on_publish'
                : 'normalized_on_publish',
          },
      })

      const published = await publishAnonymizedSample(reportId)
      console.log('[AnonymizedSample] Published')
      return NextResponse.json({
        success: true,
        showcase: published,
        preview: publicSafePreview(published, report),
        publicUrl: published?.slug ? `/sample-report/${published.slug}` : null,
      })
    }

    if (action === 'unpublish') {
      const unpublished = await unpublishAnonymizedSample(reportId)
      return NextResponse.json({ success: true, showcase: unpublished })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[Admin/anonymize POST]', err)
    return NextResponse.json({ error: 'Anonymised sample request failed' }, { status: 500 })
  }
}
