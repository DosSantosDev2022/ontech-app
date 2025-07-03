import { RichTextContent } from '@graphcms/rich-text-types'

export interface Product {
	id: string
	name: string
	imageUrl: string
	description: string
	category: {
		name: string
	}
	// Novos campos para a página de detalhes
	coverImage?: string // Imagem de capa, se for diferente da imageUrl
	technicalSpecs?: {
		raw: RichTextContent
	}
	affiliateLinks?: {
		name: string // Nome da loja (ex: "Amazon", "Magazine Luiza")
		url: string // URL do link de afiliado
	}[]
	longDescription?: {
		raw: RichTextContent
	} // Uma descrição mais longa para a página de detalhes
}
