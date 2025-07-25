import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react' // Um ícone simples para o menu mobile
import { CouponsDialog } from '@/components/global'

export function Header() {
	return (
		<header className='sticky top-0 z-50 w-full border-b lg:px-12 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container flex h-14 items-center justify-between'>
				{/* Logo ou Nome da Loja */}
				<a href='/' className='text-4xl font-bold'>
					onTech
				</a>

				{/* Navegação Principal (Desktop) */}
				<nav className='hidden md:flex space-x-4'>
					<CouponsDialog />
					
					{/* <Button variant='ghost'>Categorias</Button>
					<Button variant='ghost'>Contato</Button>
					<Button variant='ghost'>Minha Conta</Button> */}
				</nav>

				{/* Menu Mobile */}
				<div className='md:hidden'>
					<Sheet>
						<SheetTrigger asChild>
							<Button variant='ghost' size='icon'>
								<Menu className='h-6 w-6' />
								<span className='sr-only'>Abrir menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side='left'>
							<nav className='flex flex-col gap-4 pt-6'>
								<CouponsDialog />
								{/* <Button variant='ghost' className='justify-start'>
									Categorias
								</Button>
								<Button variant='ghost' className='justify-start'>
									Contato
								</Button>
								<Button variant='ghost' className='justify-start'>
									Minha Conta
								</Button> */}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	)
}
