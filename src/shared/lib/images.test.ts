import { describe, expect, it } from 'vitest'
import { responsiveImage, thumbnail } from './images'

describe('responsiveImage', () => {
  it('lists the three widths of an uploaded WebP picture', () => {
    expect(responsiveImage('https://api.test/products/abc.webp', '50vw')).toEqual({
      src: 'https://api.test/products/abc.webp',
      srcSet: 'https://api.test/products/abc-480.webp 480w, https://api.test/products/abc-960.webp 960w, https://api.test/products/abc.webp 1920w',
      sizes: '50vw',
    })
  })

  it('leaves older pictures as a single file', () => {
    expect(responsiveImage('https://api.test/products/abc.jpg', '50vw')).toEqual({ src: 'https://api.test/products/abc.jpg' })
  })
})

describe('thumbnail', () => {
  it('uses the smallest copy when there is one', () => {
    expect(thumbnail('https://api.test/p/abc.webp')).toBe('https://api.test/p/abc-480.webp')
    expect(thumbnail('https://api.test/p/abc.png')).toBe('https://api.test/p/abc.png')
  })
})
