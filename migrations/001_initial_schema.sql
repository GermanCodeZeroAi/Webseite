-- Haupttabelle für eingehende E-Mails
CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL UNIQUE,
    account_email TEXT NOT NULL,
    folder TEXT NOT NULL DEFAULT 'INBOX',
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT,
    body_html TEXT,
    received_at DATETIME NOT NULL,
    headers TEXT, -- JSON
    attachments TEXT, -- JSON Array
    status TEXT CHECK(status IN ('new', 'processing', 'processed', 'failed', 'ignored')) DEFAULT 'new',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extrahierte Daten aus E-Mails
CREATE TABLE IF NOT EXISTS extracted_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    data_type TEXT NOT NULL, -- z.B. 'appointment_request', 'patient_info', etc.
    extracted_data TEXT NOT NULL, -- JSON
    confidence REAL DEFAULT 0.0,
    validated BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

-- Entwürfe für ausgehende E-Mails
CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER,
    reply_to TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    template_used TEXT,
    status TEXT CHECK(status IN ('draft', 'scheduled', 'sent', 'failed')) DEFAULT 'draft',
    scheduled_for DATETIME,
    sent_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE SET NULL
);

-- Verfügbare Kalenderzeitslots
CREATE TABLE IF NOT EXISTS calendar_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calendar_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    appointment_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(calendar_id, start_time, end_time)
);

-- Event-Log für Audit und Debugging
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    data TEXT, -- JSON
    processed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Konfiguration und Einstellungen
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(account_email);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at);
CREATE INDEX IF NOT EXISTS idx_extracted_email ON extracted_data(email_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_available ON calendar_slots(is_available, start_time);

-- Trigger für updated_at
CREATE TRIGGER IF NOT EXISTS update_emails_timestamp 
AFTER UPDATE ON emails
BEGIN
    UPDATE emails SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_extracted_timestamp 
AFTER UPDATE ON extracted_data
BEGIN
    UPDATE extracted_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_drafts_timestamp 
AFTER UPDATE ON drafts
BEGIN
    UPDATE drafts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_calendar_timestamp 
AFTER UPDATE ON calendar_slots
BEGIN
    UPDATE calendar_slots SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;