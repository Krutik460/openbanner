import { describe, expect, it } from 'vitest'
import { personaOf } from './templates'

describe('personaOf', () => {
  it('fills every slot with placeholder copy when there is no profile', () => {
    expect(personaOf(null)).toEqual({
      name: 'Your Name',
      firstName: 'Your Name',
      tagline: 'What you do, in one line',
      tags: ['Your focus', 'Your craft'],
      company: undefined,
    })
  })

  it('treats a blank name and headline like no profile', () => {
    expect(personaOf({ name: '   ', headline: '' })).toEqual(personaOf(null))
  })

  it('splits a headline into a tagline and up to three tags', () => {
    const persona = personaOf({ name: 'Ada Lovelace', headline: 'Engineer at Analytical | Math · Poetry | Engines | Extra' })
    expect(persona.name).toBe('Ada Lovelace')
    expect(persona.firstName).toBe('Ada')
    expect(persona.tagline).toBe('Engineer at Analytical')
    expect(persona.tags).toEqual(['Math', 'Poetry', 'Engines'])
    expect(persona.company).toBe('Analytical')
  })

  it('drops placeholder tags once a single-clause headline is given', () => {
    expect(personaOf({ name: 'Ada', headline: 'Engineer' }).tags).toEqual([])
  })
})
