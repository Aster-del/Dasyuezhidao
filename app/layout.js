import "./globals.css";

export const metadata = {
  title: "點餐系統",
  description: "線上點餐 - 顧客下單與店家後台",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
