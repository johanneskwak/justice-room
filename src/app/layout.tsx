import type { Metadata } from 'next';
import './globals.css';
import './gameplay.css';
export const metadata: Metadata = { title: 'JUSTICE ROOM · 나의 권리를 찾는 모험', description: '증거를 찾고, 진실을 연결하고, 나의 권리를 지키는 청소년 법률 RPG' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}</body></html>; }
