export type Role = 'ADMIN' | 'LAB_TECHNICIAN' | 'EPIDEMIOLOGIST' | 'PHARMACIST' | 'PUBLIC_VIEWER'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  email: string
  fullName: string
  role: Role
}

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
  active: boolean
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Record<string, string>
}

export type Interpretation = 'SUSCEPTIBLE' | 'INTERMEDIATE' | 'RESISTANT'

/** Cómo quedaría un resultado antes de guardarlo (GET /isolates/interpretation-preview). */
export interface InterpretationPreview {
  interpretation: Interpretation | null
  source: 'CALCULATED' | 'LAB_REPORTED' | null
  /** Por qué no se pudo interpretar (CIM mal escrita, sin punto de corte…). */
  message: string | null
}
export type Specimen = 'BLOOD' | 'URINE' | 'RESPIRATORY' | 'WOUND' | 'CSF' | 'STOOL' | 'OTHER'

export interface Microorganism {
  id: number
  code: string
  genus: string
  species: string | null
  gramStain: string
}

export interface Antibiotic {
  id: number
  code: string
  name: string
  antibioticClass: string
}

export interface Isolate {
  id: number
  collectionDate: string
  specimenType: Specimen
  patientAge: number | null
  patientSex: string | null
  facilityName: string
  districtUbigeo: string
  districtName: string
  microorganismName: string
  dataUploadId: number | null
  /** Servicio del paciente; null si el laboratorio no lo informó. */
  ward?: Ward | null
  facilityId?: number
  microorganismId?: number
}

export type Ward = 'OUTPATIENT' | 'EMERGENCY' | 'INPATIENT' | 'ICU'

export interface SusceptibilityResult {
  id: number
  isolateId: number
  antibioticCode: string
  antibioticName: string
  micValue: number | null
  /** CIM con su calificador tal como la informa el equipo, por ejemplo ">=16" o "<=0.25". */
  micDisplay?: string | null
  diskDiffusionMm: number | null
  interpretation: Interpretation
  reportedInterpretation: Interpretation | null
  breakpointStandard: string
  breakpointVersion: string
}

export interface DistrictResistance {
  districtId: number
  ubigeo: string
  name: string
  totalTested: number
  resistantCount: number
  resistancePercentage: number | null
  sufficientData: boolean
}

export interface Facility {
  id: number
  code: string
  name: string
  districtId: number
  districtName: string
}

export interface District {
  id: number
  ubigeo: string
  name: string
  province: string
  department: string
}

export interface AntibiogramEntry {
  microorganismName: string
  antibioticName: string
  totalTested: number
  resistantCount: number
  resistancePercentage: number
}

export interface ReferralFacility {
  id: number
  name: string
  isolateCount: number
  sharePercentage: number
}

export interface ReferralAntibiogram {
  districtName: string
  facilities: ReferralFacility[]
  entries: AntibiogramEntry[]
}

export interface CreateIsolatePayload {
  collectionDate: string
  specimenType: Specimen
  patientAge: number
  patientSex: 'M' | 'F'
  facilityId: number
  microorganismId: number
  ward: Ward
  /** Antibiograma: se guarda junto con el aislamiento (al menos uno). */
  results: { antibioticId: number; mic?: string; reportedInterpretation?: Interpretation }[]
  /** Historia clínica o DNI: el servidor guarda solo un seudónimo HMAC. */
  patientId?: string
  /** Otro aislamiento del mismo paciente: reutiliza su seudónimo. */
  samePatientAsIsolateId?: number
}
export type Syndrome = 'BACTEREMIA' | 'URINARY' | 'RESPIRATORY' | 'SKIN_SOFT_TISSUE' | 'MENINGITIS'

export interface WiscaRegimen {
  code: string
  antibioticNames: string[]
  coverageMedian: number
  credibleLow: number
  credibleHigh: number
  probabilityAboveTarget: number
  probabilityBest: number
  untestedFrequency: number
  /** Sin pruebas ni fenotipo esperado de EUCAST: se cuentan como no cubiertos. */
  untestedPathogens: string[]
  /** Sin pruebas, sensibles esperados según EUCAST: se cuentan como cubiertos. */
  expectedSusceptiblePathogens?: string[]
  /** Sin pruebas, resistentes esperados según EUCAST: se cuentan como no cubiertos. */
  expectedResistantPathogens?: string[]
}

export interface WiscaResult {
  syndrome: Syndrome
  syndromeLabel: string
  isolates: number
  sufficientData: boolean
  targetCoverage: number
  pathogens: { name: string; isolates: number; frequency: number }[]
  regimens: WiscaRegimen[]
}

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED'

export interface ResistanceAlert {
  id: number
  facilityName: string
  microorganismName: string
  antibioticName: string
  antibioticClass: string
  status: AlertStatus
  detectedOn: string
  windowStart: string
  windowEnd: string
  testedCount: number
  resistantCount: number
  observedPercentage: number
  baselineTested: number
  baselineResistant: number
  baselinePercentage: number
  pValue: number
}

/** Normas con que se interpretan y agregan los resultados (GET /standards). */
export interface Standards {
  breakpoints: string
  breakpointStandard: string
  breakpointVersion: string
  aggregation: string
  expectedPhenotypes: string
}
