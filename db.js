CREATE TABLE user (
    user_id VARCHAR(360) PRIMARY KEY,
    role ENUM('admin', 'client', 'employer'),
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    iscomplete BOOLEAN DEFAULT FALSE
);

CREATE TABLE passengers (
    passenger_id VARCHAR(360) PRIMARY KEY,
    user_id VARCHAR(360),
    full_name VARCHAR(255),
    id_document VARCHAR(100),
    birth DATE,
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE document_types (
    document_type_id VARCHAR(360) PRIMARY KEY,
    type ENUM('id card', 'passport')
);

CREATE TABLE company (
    company_id VARCHAR(360) PRIMARY KEY,
    full_name VARCHAR(255),
    head_quater VARCHAR(255),
    path_logo VARCHAR(500)
);

CREATE TABLE garre (
    garre_id VARCHAR(360) PRIMARY KEY,
    lat DECIMAL(11, 8),
    `long` DECIMAL(11, 8),
    nom VARCHAR(255),
    ville VARCHAR(255)
);

CREATE TABLE agence (
    agence_id VARCHAR(360) PRIMARY KEY,
    company_id VARCHAR(360),
    garre_id VARCHAR(360),
    contact VARCHAR(255),
    FOREIGN KEY (company_id) REFERENCES company(company_id),
    FOREIGN KEY (garre_id) REFERENCES garre(garre_id)
);

CREATE TABLE bus (
    id_bus VARCHAR(360) PRIMARY KEY,
    model VARCHAR(100),
    year INT,
    plate VARCHAR(50),
    color VARCHAR(50),
    rout_led BOOLEAN,
    wifi BOOLEAN,
    securitycamera BOOLEAN,
    toilet BOOLEAN,
    airconditioning BOOLEAN,
    poweroutlet BOOLEAN,
    tv BOOLEAN,
    Vipclass BOOLEAN,
    totalSeats INT,
    plan TEXT
);

CREATE TABLE real_time (
    real_time_id VARCHAR(360) PRIMARY KEY,
    trip_id VARCHAR(360),
    available_seat INT,
    last_update TIMESTAMP,
    reservation_lock BOOLEAN,
    reservation_complete BOOLEAN
);

CREATE TABLE dynamic_pricing (
    pricing_id VARCHAR(360) PRIMARY KEY,
    trip_id VARCHAR(360),
    base_price DECIMAL(10, 2),
    current_price DECIMAL(10, 2),
    demand_factor DECIMAL(5, 2),
    seats_fill_percentage DECIMAL(5, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE trips (
    trip_id VARCHAR(360) PRIMARY KEY,
    id_agence_depart VARCHAR(360),
    id_agence_dest VARCHAR(360),
    real_time_id VARCHAR(360),
    dynamic_pricing_id VARCHAR(360),
    status ENUM('close', 'ongoing'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_bus VARCHAR(360),
    departure_time DATETIME,
    FOREIGN KEY (id_agence_depart) REFERENCES agence(agence_id),
    FOREIGN KEY (id_agence_dest) REFERENCES agence(agence_id),
    FOREIGN KEY (real_time_id) REFERENCES real_time(real_time_id),
    FOREIGN KEY (dynamic_pricing_id) REFERENCES dynamic_pricing(pricing_id),
    FOREIGN KEY (id_bus) REFERENCES bus(id_bus)
);

CREATE TABLE booking (
    book_id VARCHAR(360) PRIMARY KEY,
    trip_id VARCHAR(360),
    passenger_id VARCHAR(360),
    seats INT,
    status VARCHAR(50),
    date DATE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id)
);

CREATE TABLE transaction (
    transaction_id VARCHAR(360) PRIMARY KEY,
    book_id VARCHAR(360),
    amount DECIMAL(10, 2),
    method VARCHAR(100),
    payment_status VARCHAR(50),
    initiate_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminate_at TIMESTAMP,
    ref_number VARCHAR(100),
    momo_status VARCHAR(50),
    currency VARCHAR(10),
    FOREIGN KEY (book_id) REFERENCES booking(book_id)
);

CREATE TABLE transaction_history (
    id_history VARCHAR(360) PRIMARY KEY,
    transaction_id VARCHAR(360),
    type ENUM('created', 'update', 'deleted'),
    details JSON,
    change_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id)
);

CREATE TABLE sessions (
    session_id VARCHAR(360) PRIMARY KEY,
    user_id VARCHAR(360),
    token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP,
    coordonnees VARCHAR(255),
    user_agent VARCHAR(500),
    ip_adress VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE bus_tracking (
    tracking_id VARCHAR(360) PRIMARY KEY,
    trips_id VARCHAR(360),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timestamp TIMESTAMP,
    FOREIGN KEY (trips_id) REFERENCES trips(trip_id)
);

CREATE TABLE notifications (
    notification_id VARCHAR(360) PRIMARY KEY,
    trip_id VARCHAR(360),
    message TEXT,
    status ENUM('waiting', 'sent'),
    scheduled DATETIME,
    sent_at TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
);

CREATE TABLE ticket (
    book_id VARCHAR(360) PRIMARY KEY,
    status ENUM('generated', 'pending'),
    FOREIGN KEY (book_id) REFERENCES booking(book_id)
);

CREATE TABLE promo (
    promo_id VARCHAR(360) PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    promo_type ENUM('referral', 'general', 'first booking', 'seasonal'),
    discount_type ENUM('fixed', 'percentage'),
    discount_value DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    max_usage INT,
    current_usage INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    referrals_tier INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE parrainage (
    parrainage_id VARCHAR(360) PRIMARY KEY,
    user_id VARCHAR(360),
    code_parrainage VARCHAR(50) UNIQUE,
    total_parrainee INT DEFAULT 0,
    total_gagne DECIMAL(10, 2) DEFAULT 0,
    promotion JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transaction_parrainage (
    transaction_parrainage_id VARCHAR(360) PRIMARY KEY,
    user_id VARCHAR(360),
    promotion_id VARCHAR(360),
    booking_id VARCHAR(360),
    bonus_amount DECIMAL(10, 2),
    bonus_type ENUM('referral_bonus', 'promotion_discount'),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (promotion_id) REFERENCES promo(promo_id),
    FOREIGN KEY (booking_id) REFERENCES booking(book_id)
);

CREATE TABLE routes (
    route_id VARCHAR(360) PRIMARY KEY,
    id_agence_depart VARCHAR(360),
    id_agence_arrivee VARCHAR(360),
    distance DECIMAL(10, 2),
    estimated_time TIME,
    route_status VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_agence_depart) REFERENCES agence(agence_id),
    FOREIGN KEY (id_agence_arrivee) REFERENCES agence(agence_id)
);

CREATE TABLE booking_audit (
    log_id VARCHAR(360) PRIMARY KEY,
    booking_id VARCHAR(360),
    action_type ENUM('reserve', 'cancel', 'modify'),
    user_id VARCHAR(360),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_state JSON,
    new_state JSON,
    FOREIGN KEY (booking_id) REFERENCES booking(book_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);