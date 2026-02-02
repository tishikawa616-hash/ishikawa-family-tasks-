import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50">
      <h1 className="text-xl font-bold text-red-600 mb-4">認証エラー</h1>
      <p className="text-gray-700 mb-6">
        ログイン用のリンクが無効か、期限切れです。<br />
        もう一度最初からお試しください。
      </p>
      <Link href="/accounting/login" className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold">
        ログイン画面へ
      </Link>
    </div>
  );
}
