/**
 * Org types for team walls.
 *
 * Hierarchy: Town → Organization → Wall (one wall per org per sport).
 * Public schools sit under their town name directly. Private schools,
 * colleges, youth programs, and pro teams are distinct orgs within
 * the same town.
 */

export const ORG_TYPES = [
  { id: 'public_hs',      label: 'Public HS',      hint: 'Town-affiliated public high school' },
  { id: 'private_school', label: 'Private School', hint: 'Independent or parochial school' },
  { id: 'college',        label: 'College',        hint: 'University or college program' },
  { id: 'youth_program',  label: 'Youth Program',  hint: 'Rec league, travel team, or club' },
  { id: 'pro',            label: 'Pro',            hint: 'Professional team' },
]

export const ORG_TYPE_IDS = ORG_TYPES.map(t => t.id)

export function getOrgTypeLabel(id) {
  return ORG_TYPES.find(t => t.id === id)?.label || 'Organization'
}
