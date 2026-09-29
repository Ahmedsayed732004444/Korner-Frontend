import { HeroSlider } from '@/features/content'
import { CategorySection } from './home/CategorySection'
import { FeaturedProducts } from './home/FeaturedProducts'
import { TrustStrip } from './home/TrustStrip'

export function HomePage() {
  return (
    <>
      <HeroSlider />
      <TrustStrip />
      <CategorySection />
      <FeaturedProducts />
    </>
  )
}
