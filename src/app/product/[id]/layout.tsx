// app/products/[id]/layout.tsx
import { getProductByIdFromHygraph } from '@/lib/hygraph'
import { ReactNode } from 'react'

interface ProductLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

// Função generateMetadata, agora no Server Component
export async function generateMetadata({ params }: ProductLayoutProps) {
  const productId = (await params).id
 
  const product = await getProductByIdFromHygraph(productId)

  if (!product) {
    return {
      title: 'Produto Não Encontrado - Sua Loja',
      description: 'O produto que você está procurando não foi encontrado em nossa loja.',
    }
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.coverImage || product.imageUrl,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.coverImage || product.imageUrl],
    },
  }
}

// Este é o Layout do Server Component que renderiza seu Client Component
export default function ProductLayout({ children }: ProductLayoutProps) {
  return <>{children}</>
}