import ConfirmForm from "@/features/accounting/components/ConfirmForm";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  
  // Extract data from query params (which might be passed from Gemini analysis or manual redirect)
  const amount = Number(params.amount || 0);
  const date = (params.date as string) || new Date().toISOString().split('T')[0];
  const category = (params.category as string) || '';
  const description = (params.description as string) || '';
  const ocr_text = (params.ocr_text as string) || '';

  const initialData = {
    amount,
    date,
    category,
    description,
    ocr_text
  };

  return (
    <main className="min-h-screen bg-[#F8F7F2] p-4 flex flex-col h-screen overflow-hidden">
      <h1 className="text-center font-bold text-[#78350F] mb-4">内容の確認</h1>
      <ConfirmForm initialData={initialData} />
    </main>
  );
}
