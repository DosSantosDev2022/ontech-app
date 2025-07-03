import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import React from 'react'

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
	size?: 'sm' | 'md' | 'lg'
}

export function Spinner({
	size = 'md',
	className,
	...props
}: SpinnerProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
	}

	return (
		<Loader2
			className={cn(
				'animate-spin text-primary',
				sizeClasses[size],
				className,
			)}
			{...props}
		/>
	)
}
