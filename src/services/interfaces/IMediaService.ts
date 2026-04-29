export interface IMediaService {
  uploadImage(file: File): Promise<string | null>;
}
