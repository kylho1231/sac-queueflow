-- SAC QueueFlow Database Schema (PostgreSQL / Supabase)
-- Institution: St. Anthony's College, San Jose de Buenavista, Antique, Philippines
-- Version: 1.0.0 Production DDL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Users: Students, Staff, Admins)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    student_number TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
    office_id UUID,
    is_verified BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campus Offices (Registrar, Cashier, etc.)
CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g. 'REG', 'CSH'
    description TEXT,
    prefix TEXT NOT NULL, -- e.g. 'R', 'C'
    location TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    average_service_minutes INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Service Categories
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Service Counters
CREATE TABLE IF NOT EXISTS service_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    counter_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_paused BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (office_id, counter_number)
);

-- 5. Queue Sessions (Daily / Periodic sequence control)
CREATE TABLE IF NOT EXISTS queue_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_sequence INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (office_id, session_date)
);

-- 6. Queue Tickets
CREATE TABLE IF NOT EXISTS queue_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_session_id UUID REFERENCES queue_sessions(id) ON DELETE SET NULL,
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_email TEXT,
    student_number TEXT,
    is_walk_in BOOLEAN DEFAULT FALSE,
    ticket_number TEXT NOT NULL, -- e.g. 'R-042'
    sequence_number INTEGER NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,
    lookup_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'WAITING' 
        CHECK (status IN ('WAITING', 'NOTIFIED', 'CALLED', 'SERVING', 'COMPLETED', 'DEFERRED', 'SKIPPED', 'NO_SHOW', 'CANCELLED')),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    assigned_counter_id UUID REFERENCES service_counters(id) ON DELETE SET NULL,
    deferment_count INTEGER DEFAULT 0,
    max_deferments_allowed INTEGER DEFAULT 2,
    deferment_reason TEXT,
    deferment_expires_at TIMESTAMPTZ,
    notes TEXT
);

-- 7. Queue Audit Events (Immutable chronological history)
CREATE TABLE IF NOT EXISTS queue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES queue_tickets(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    performed_by_role TEXT NOT NULL,
    performed_by_id UUID,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES queue_tickets(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INFO', 'APPROACHING', 'CALLED', 'DEFERRED', 'COMPLETED', 'WARNING')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    in_app BOOLEAN DEFAULT TRUE,
    browser_push BOOLEAN DEFAULT TRUE,
    sms BOOLEAN DEFAULT FALSE,
    email BOOLEAN DEFAULT TRUE,
    notify_threshold_ahead INTEGER DEFAULT 3,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Campus Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queue calculations and ordering
CREATE INDEX IF NOT EXISTS idx_queue_tickets_office_status ON queue_tickets(office_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_student ON queue_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_qr_token ON queue_tickets(qr_token);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_lookup_code ON queue_tickets(lookup_code);
CREATE INDEX IF NOT EXISTS idx_queue_events_ticket ON queue_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_unread ON notifications(student_id, is_read);

-- Row Level Security (RLS) Enablement
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policies:
-- Public can read offices and active services
CREATE POLICY "Public can view offices" ON offices FOR SELECT USING (true);
CREATE POLICY "Public can view services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view announcements" ON announcements FOR SELECT USING (is_active = true);

-- Students can read their own tickets
CREATE POLICY "Students can view their own tickets" ON queue_tickets 
    FOR SELECT USING (auth.uid() = student_id OR student_id IS NULL);

-- Staff can view and update tickets for their assigned office
CREATE POLICY "Staff can view all tickets in office" ON queue_tickets 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND profiles.office_id = queue_tickets.office_id))
        )
    );
