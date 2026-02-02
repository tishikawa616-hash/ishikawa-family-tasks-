import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8F7F2]">
      <h1 className="text-xl font-bold text-[#78350F] mb-4">ページが見つかりません</h1>
      <p className="text-gray-500 mb-6">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link href="/accounting" className="px-6 py-3 bg-[#4D7C0F] text-white rounded-xl font-bold">
        ホームへ戻る
      </Link>
    </div>
  );
}
