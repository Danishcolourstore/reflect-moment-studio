export interface FaceDetectionResult {
  success: boolean;
  faceId?: string;
  confidence?: number;
  error?: string;
}

export interface FaceMatchResult {
  success: boolean;
  matchedPhotoIds: string[];
  confidenceScores: Record<string, number>;
  error?: string;
}

export interface FaceRecognitionService {
  detectFace(imageUrl: string): Promise<FaceDetectionResult>;
  storeEmbedding(photoId: string, imageUrl: string): Promise<{ success: boolean; embeddingId?: string }>;
  matchFace(selfieUrl: string, eventId: string): Promise<FaceMatchResult>;
  indexEventFaces(eventId: string): Promise<{ success: boolean; indexed: number }>;
}
