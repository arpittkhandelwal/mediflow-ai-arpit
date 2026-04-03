-- ============================================================
-- MediFlow AI — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  age             INT CHECK (age >= 0 AND age <= 150),
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group     TEXT,
  contact         TEXT,
  address         TEXT,
  medical_history JSONB DEFAULT '{}',
  allergies       TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DOCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  specialization    TEXT DEFAULT 'General Physician',
  qualification     TEXT DEFAULT 'MBBS',
  experience        INT DEFAULT 0,
  consultation_fee  NUMERIC(10,2) DEFAULT 500,
  registration_no   TEXT,
  hospital          TEXT,
  bio               TEXT,
  available         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  slot_time   TEXT,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PRESCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  medicines   JSONB NOT NULL DEFAULT '[]',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  report_type TEXT DEFAULT 'lab_report',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. EMERGENCY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  location    JSONB,
  message     TEXT,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SYMPTOM LOGS TABLE (AI tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  symptoms    TEXT NOT NULL,
  result      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs    ENABLE ROW LEVEL SECURITY;

-- Users: can see their own profile
CREATE POLICY "Users see own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Patients: can see their own data
CREATE POLICY "Patients see own data" ON public.patients
  FOR ALL USING (auth.uid() = user_id);

-- Doctors: anyone can read doctor list (for Find-a-Doctor)
CREATE POLICY "Doctors public read" ON public.doctors
  FOR SELECT USING (true);
CREATE POLICY "Doctors manage own" ON public.doctors
  FOR ALL USING (auth.uid() = user_id);

-- Appointments: patients see their own, doctors see theirs
CREATE POLICY "Appointments access" ON public.appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

-- Prescriptions: patients see their own, doctors see theirs
CREATE POLICY "Prescriptions access" ON public.prescriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

-- Reports: patients see their own
CREATE POLICY "Reports own access" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid())
  );

-- Emergency: patients manage their own
CREATE POLICY "Emergency own access" ON public.emergency_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid())
  );

-- Symptom logs: patients see their own
CREATE POLICY "Symptom logs own" ON public.symptom_logs
  FOR ALL USING (
    patient_id IS NULL OR
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid())
  );

-- ============================================================
-- SUPABASE STORAGE BUCKET
-- ============================================================
-- Run this separately in Storage section or use the dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at     BEFORE UPDATE ON public.users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER patients_updated_at  BEFORE UPDATE ON public.patients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER doctors_updated_at   BEFORE UPDATE ON public.doctors   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appts_updated_at     BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
