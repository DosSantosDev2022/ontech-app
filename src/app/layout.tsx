import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider' // Importe o provedor
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

const dominio = "https://ontech-app.vercel.app/"

export const metadata: Metadata = {
  title: 'OnTech - Afiliado', // Título principal da página
  description: 'Descubra uma vasta seleção de produtos de alta qualidade em nossa loja online. Encontre as melhores ofertas em eletrônicos, moda, casa e muito mais.', // Descrição para SEO
  keywords: ['produtos online', 'loja virtual', 'eletrônicos', 'moda', 'ofertas', 'comprar online', 'gamer' , 'afiliado','notebooks','Pcs', 'smartphones','placas de vídeo','novidades da tecnologia'], // Palavras-chave
  openGraph: { // Metadados para redes sociais (Facebook, LinkedIn, etc.)
    title: 'OnTech - Afiliado',
    description: 'Encontre os produtos que você ama com preços imperdíveis',
    url: dominio, // URL canônica do seu site
    siteName: 'OnTech - Afiliado',
    images: [
      {
        url: `${dominio}/og-image.jpg`, // Imagem que aparece ao compartilhar o link
        width: 1200,
        height: 630,
        alt: 'OnTech - Afiliado',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { // Instruções para robôs de busca
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  alternates: { // Para URLs canônicas ou alternativas de idioma
    canonical: dominio,
    languages: {
      'pt-BR': dominio,
    },
  },
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
          <Footer />
				</QueryProvider>
			</body>
		</html>
	)
}
