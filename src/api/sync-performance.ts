
// This function is disabled in the Mock Data version to prevent errors.
// It previously depended on @supabase/supabase-js which has been removed.

export default async function handler(request: any, response: any) {
    return response.status(200).json({ message: "Sync Performance API is disabled in Mock Mode." });
}
