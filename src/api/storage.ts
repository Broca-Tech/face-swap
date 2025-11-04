// import { supabase } from '../lib/supabase'; // TODO: 実装時に使用

/**
 * 画像をSupabaseストレージにアップロードし、公開URLを返す
 * @param file アップロードする画像ファイル
 * @returns 画像の公開URL
 */
export const uploadImage = async (file: File): Promise<string> => {
  // TODO: 実装予定 - 現在はダミーURLを返す
  console.log('uploadImage called with file:', file.name, file.size, 'bytes');

  // ダミーURLを返す（連携確認用）
  return 'https://urassh.dev/uraassh.png';

  /* 実装予定のコード:
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('face-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('face-images').getPublicUrl(data.path);

  return publicUrl;
  */
};
