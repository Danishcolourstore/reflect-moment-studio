import type { FaceRecognitionService, FaceDetectionResult, FaceMatchResult } from './FaceRecognitionService';

export class MockFaceRecognitionService implements FaceRecognitionService {
  async detectFace(imageUrl: string): Promise<FaceDetectionResult> {
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, faceId: `mock_face_${Date.now()}`, confidence: 0.97 };
  }

  async storeEmbedding(photoId: string, _imageUrl: string) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, embeddingId: `mock_embed_${photoId}` };
  }

  async matchFace(_selfieUrl: string, _eventId: string): Promise<FaceMatchResult> {
    await new Promise(r => setTimeout(r, 2000));
    return { success: true, matchedPhotoIds: [], confidenceScores: {} };
  }

  async indexEventFaces(_eventId: string) {
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, indexed: 0 };
  }
}

export const faceRecognitionService: FaceRecognitionService = new MockFaceRecognitionService();
