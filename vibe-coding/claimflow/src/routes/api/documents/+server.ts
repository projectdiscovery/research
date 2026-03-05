import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadDocument, uploadMultipleDocuments } from '$lib/server/uploads';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const files = formData.getAll('files') as File[];
	const documentType = formData.get('documentType')?.toString() || 'other';
	const claimId = formData.get('claimId')?.toString();
	const policyId = formData.get('policyId')?.toString();
	const description = formData.get('description')?.toString();

	if (files.length === 0) {
		throw error(400, 'No files provided');
	}

	if (files.length === 1) {
		const result = await uploadDocument(
			files[0],
			locals.user.id,
			documentType as 'photo' | 'receipt' | 'police_report' | 'medical_record' | 'estimate' | 'identification' | 'policy_document' | 'proof_of_loss' | 'other',
			{ claimId, policyId, description }
		);

		if (!result.success) {
			throw error(400, result.error || 'Upload failed');
		}

		return json({ success: true, document: result.document });
	}

	const results = await uploadMultipleDocuments(
		files,
		locals.user.id,
		documentType as 'photo' | 'receipt' | 'police_report' | 'medical_record' | 'estimate' | 'identification' | 'policy_document' | 'proof_of_loss' | 'other',
		{ claimId, policyId }
	);

	return json({
		success: true,
		uploaded: results.successful.length,
		failed: results.failed.length,
		documents: results.successful,
		errors: results.failed
	});
};
