/**
 * Clinical Aurora — shared component barrel.
 * Surface agents import from '@/components/ui/aurora'.
 */

export { GlassPanel, type GlassPanelProps } from './glass-panel';
export { SectionHeader, type SectionHeaderProps } from './section-header';
export { StatTile, type StatTileProps, type StatTone } from './stat-tile';
export { AmbientBackground } from './ambient-background';
export { BrandMark, type BrandMarkProps } from './brand-mark';
export { BodyHalo, type BodyHaloProps } from './body-halo';
export {
  useReduced,
  EASE,
  SPRING,
  DURATION,
  sectionEntrance,
  staggerContainer,
  staggerItem,
  hoverLift,
  panelEntrance,
  reducedItem,
  reducedFade,
} from './motion';
