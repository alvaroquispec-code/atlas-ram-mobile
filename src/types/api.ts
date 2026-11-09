export type Role = 'ADMIN' | 'LAB_TECHNICIAN' | 'EPIDEMIOLOGIST' | 'PUBLIC_VIEWER'

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
}

export interface SusceptibilityResult {
  id: number
  isolateId: number
  antibioticCode: string
  antibioticName: string
  micValue: number | null
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

export interface CreateIsolatePayload {
  collectionDate: string
  specimenType: Specimen
  patientAge: number | null
  patientSex: 'M' | 'F' | null
  facilityId: number
  microorganismId: number
}