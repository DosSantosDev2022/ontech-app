import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider' // Importe o provedor
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Minha Loja Online',
	description: 'Um e-commerce moderno construído com Next.js e Shadcn UI.',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='pt-BR'>
			<body className={`${inter.className} scrollbar-custom dark`}>
				<QueryProvider>
					<Header />
					{children}
				</QueryProvider>
			</body>
		</html>
	)
}
