'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from './Header'
import { ProductGrid } from './ProductGrid'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getProductsPaginated } from '@/lib/actions/products'
import { ProductWithDetails } from '@/lib/types/database'

type Category = 'all' | 'clothes' | 'shoes' | 'accessories'

export function ProductListing() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const category = (searchParams.get('category') as Category) || 'all'
  const page = parseInt(searchParams.get('page') || '1', 10)
  
  const [products, setProducts] = useState<ProductWithDetails[] | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    async function fetchProducts() {
      const productType = category === 'all' ? undefined : category
      const { data, error, totalPages: pages, totalCount: count } = await getProductsPaginated(
        productType,
        page,
        8
      )
      
      if (error) {
        console.error('Error fetching products:', error)
        setProducts([])
        return
      }
      
      setProducts(data || [])
      setTotalPages(pages)
      setTotalCount(count)
    }

    fetchProducts()
  }, [category, page])

  const handleCategoryChange = (newCategory: Category) => {
    startTransition(() => {
      router.push(`/?category=${newCategory}&page=1`)
    })
  }

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(`/?category=${category}&page=${newPage}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    <>
      <Header category={category} />
      <div className="container mx-auto px-4 py-8">
        <Tabs value={category} onValueChange={(value) => handleCategoryChange(value as Category)} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="shoes">Shoes</TabsTrigger>
              <TabsTrigger value="clothes">Clothes</TabsTrigger>
              <TabsTrigger value="accessories">Accessories</TabsTrigger>
            </TabsList>
          </div>

          <ProductGrid
            products={products}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isPending}
          />
        </Tabs>
      </div>
    </>
  )
}

