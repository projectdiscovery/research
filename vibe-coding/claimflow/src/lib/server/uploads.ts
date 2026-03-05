import { db } from './db';
import { documents } from './db/schema';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { Document, NewDocument } from './db/schema';

const UPLOAD_DIR = './uploads';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_TYPES: Record<string, string[]> = {
	'image/jpeg': ['jpg', 'jpeg'],
	'image/png': ['png'],
	'image/gif': ['gif'],
	'image/webp': ['webp'],
	'application/pdf': ['pdf'],
	'application/msword': ['doc'],
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
	'video/mp4': ['mp4'],
	'video/webm': ['webm'],
	'video/quicktime': ['mov'],
	'video/x-msvideo': ['avi']
};

type DocumentType = 'photo' | 'receipt' | 'police_report' | 'medical_record' | 'estimate' | 'identification' | 'policy_document' | 'proof_of_loss' | 'other';

interface UploadResult {
	success: boolean;
	document?: Document;
	error?: string;
}

export async function uploadDocument(
	file: File,
	userId: string,
	documentType: DocumentType,
	options: {
		claimId?: string;
		policyId?: string;
		description?: string;
	} = {}
): Promise<UploadResult> {
	if (file.size > MAX_FILE_SIZE) {
		return { success: false, error: 'File size exceeds 10MB limit' };
	}

	if (!ALLOWED_TYPES[file.type]) {
		return { success: false, error: 'File type not allowed' };
	}

	const fileId = uuidv4();
	const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
	const fileName = `${fileId}.${extension}`;
	
	let subDir = 'general';
	if (options.claimId) {
		subDir = `claims/${options.claimId}`;
	} else if (options.policyId) {
		subDir = `policies/${options.policyId}`;
	}

	const uploadPath = join(UPLOAD_DIR, subDir);
	const filePath = join(uploadPath, fileName);
	const relativePath = `/${subDir}/${fileName}`;

	try {
		await mkdir(uploadPath, { recursive: true });
		
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(filePath, buffer);

		const documentData: NewDocument = {
			id: uuidv4(),
			claimId: options.claimId || null,
			policyId: options.policyId || null,
			userId,
			fileName,
			originalName: file.name,
			fileType: file.type,
			fileSize: file.size,
			filePath: relativePath,
			documentType,
			description: options.description || null,
			isVerified: false
		};

		await db.insert(documents).values(documentData);

		return { success: true, document: documentData as Document };
	} catch (error) {
		console.error('Upload error:', error);
		return { success: false, error: 'Failed to upload file' };
	}
}

export async function uploadMultipleDocuments(
	files: File[],
	userId: string,
	documentType: DocumentType,
	options: {
		claimId?: string;
		policyId?: string;
	} = {}
): Promise<{ successful: Document[]; failed: { name: string; error: string }[] }> {
	const successful: Document[] = [];
	const failed: { name: string; error: string }[] = [];

	for (const file of files) {
		const result = await uploadDocument(file, userId, documentType, options);
		if (result.success && result.document) {
			successful.push(result.document);
		} else {
			failed.push({ name: file.name, error: result.error || 'Unknown error' });
		}
	}

	return { successful, failed };
}

export function getDocumentUrl(filePath: string): string {
	return `/api/documents${filePath}`;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
	photo: 'Photo/Image',
	receipt: 'Receipt',
	police_report: 'Police Report',
	medical_record: 'Medical Record',
	estimate: 'Repair Estimate',
	identification: 'Identification',
	policy_document: 'Policy Document',
	proof_of_loss: 'Proof of Loss',
	other: 'Other'
};
