

from home page ,

{
    to localstorage: (depart,
    destination, datetime(future))
}

signup page 
{
    to backend: authtoken (google), user_agent, ip, coordonnees gps)
    from back: jwttoken
}

from search page
{
    to back : depart, destination, datetime 
    from back : trips_overview

}

from overview page

{
    to backend : seats number , trip_id
    from back: real_time_availability
}

from contact page

{
    to back: passengers (fullname, id (passport ou cni), birth, tel)*seats choosen
}

from payment page
{
     to back: method, account number , account owner , 
     from back : after pay succes , generate and sent ticket 
}



CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
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
    passenger_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    full_name VARCHAR(255),
    id_document VARCHAR(100),
    birth DATE,
    phone VARCHAR(20),
    type ENUM('id card', 'passport'),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE company (
    company_id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255),
    head_quater VARCHAR(255),
    path_logo VARCHAR(500)
);

CREATE TABLE garre (
    garre_id VARCHAR(255) PRIMARY KEY,
    lat DECIMAL(10, 8),
    `long` DECIMAL(11, 8),
    nom VARCHAR(255),
    ville VARCHAR(255)
);

CREATE TABLE agence (
    agence_id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255),
    garre_id VARCHAR(255),
    contact VARCHAR(255),
    FOREIGN KEY (company_id) REFERENCES company(company_id),
    FOREIGN KEY (garre_id) REFERENCES garre(garre_id)
);

CREATE TABLE bus (
    id_bus VARCHAR(255) PRIMARY KEY,
    model VARCHAR(100),
    year INT,
    plate VARCHAR(50),
    color VARCHAR(50),
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

CREATE TABLE routes (
    route_id VARCHAR(255) PRIMARY KEY,
    id_agence_depart VARCHAR(255),
    id_agence_arrivee VARCHAR(255),
    distance DECIMAL(10, 2),
    estimated_time TIME,
    route_status VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_agence_depart) REFERENCES agence(agence_id),
    FOREIGN KEY (id_agence_arrivee) REFERENCES agence(agence_id)
);

CREATE TABLE trips (
    trip_id VARCHAR(255) PRIMARY KEY,
    id_agence_depart VARCHAR(255),
    id_agence_dest VARCHAR(255),
    route_id VARCHAR(255),
    status ENUM('close', 'ongoing'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_bus VARCHAR(255),
    departure_time DATETIME,
    FOREIGN KEY (id_agence_depart) REFERENCES agence(agence_id),
    FOREIGN KEY (id_agence_dest) REFERENCES agence(agence_id),
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (id_bus) REFERENCES bus(id_bus)
);

CREATE TABLE real_time (
    real_time_id VARCHAR(255) PRIMARY KEY,
    trip_id VARCHAR(255),
    available_seat INT,
    last_update TIMESTAMP,
    reservation_lock BOOLEAN,
    reservation_complete BOOLEAN,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
);

CREATE TABLE dynamic_pricing (
    pricing_id VARCHAR(255) PRIMARY KEY,
    trip_id VARCHAR(255),
    base_price DECIMAL(10, 2),
    current_price DECIMAL(10, 2),
    demand_factor DECIMAL(5, 2),
    seats_fill_percentage DECIMAL(5, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
);

CREATE TABLE booking (
    book_id VARCHAR(255) PRIMARY KEY,
    trip_id VARCHAR(255),
    passenger_id VARCHAR(255),
    seats INT,
    status VARCHAR(50),
    date DATE,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id)
);

CREATE TABLE transaction (
    transaction_id VARCHAR(255) PRIMARY KEY,
    book_id VARCHAR(255),
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
    id_history VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255),
    type ENUM('created', 'update', 'deleted'),
    details JSON,
    change_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id)
);

CREATE TABLE sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP,
    coordonnees VARCHAR(255),
    user_agent VARCHAR(500),
    ip_adress VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE bus_tracking (
    tracking_id VARCHAR(255) PRIMARY KEY,
    trips_id VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timestamp TIMESTAMP,
    FOREIGN KEY (trips_id) REFERENCES trips(trip_id)
);

CREATE TABLE notifications (
    notification_id VARCHAR(255) PRIMARY KEY,
    trip_id VARCHAR(255),
    message TEXT,
    status ENUM('waiting', 'sent'),
    scheduled DATETIME,
    sent_at TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
);

CREATE TABLE ticket (
    book_id VARCHAR(255) PRIMARY KEY,
    status ENUM('generated', 'pending'),
    FOREIGN KEY (book_id) REFERENCES booking(book_id)
);

CREATE TABLE promo (
    promo_id VARCHAR(255) PRIMARY KEY,
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
    parrainage_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    code_parrainage VARCHAR(50) UNIQUE,
    total_parrainee INT DEFAULT 0,
    total_gagne DECIMAL(10, 2) DEFAULT 0,
    promotion JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transaction_parrainage (
    transaction_parrainage_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    promotion_id VARCHAR(255),
    booking_id VARCHAR(255),
    bonus_amount DECIMAL(10, 2),
    bonus_type ENUM('referral_bonus', 'promotion_discount'),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (promotion_id) REFERENCES promo(promo_id),
    FOREIGN KEY (booking_id) REFERENCES booking(book_id)
);

CREATE TABLE booking_audit (
    log_id VARCHAR(255) PRIMARY KEY,
    booking_id VARCHAR(255),
    action_type ENUM('reserve', 'cancel', 'modify'),
    user_id VARCHAR(255),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_state JSON,
    new_state JSON,
    FOREIGN KEY (booking_id) REFERENCES booking(book_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


///////////////////////////

-- 1. Trigger de complétion de profil utilisateur
DELIMITER //
CREATE TRIGGER update_user_profile_completion BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.full_name IS NOT NULL 
       AND NEW.email IS NOT NULL 
       AND NEW.phone_number IS NOT NULL 
    THEN
        SET NEW.iscomplete = TRUE;
    ELSE
        SET NEW.iscomplete = FALSE;
    END IF;
END;//
DELIMITER ;

-- 2. Trigger de génération de code parrainage
DELIMITER //
CREATE TRIGGER generate_referral_code AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO parrainage (
        user_id, 
        code_parrainage
    ) VALUES (
        NEW.user_id, 
        CONCAT(
            UPPER(LEFT(NEW.full_name, 3)), 
            FLOOR(RAND() * 10000)
        )
    );
END;//
DELIMITER ;

-- 3. Trigger de validation de document passager
DELIMITER //
CREATE TRIGGER validate_passenger_document BEFORE INSERT ON passengers
FOR EACH ROW
BEGIN
    IF NEW.type = 'passport' AND LENGTH(NEW.id_document) < 6 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Passport number must be at least 6 characters';
    END IF;
    
    IF NEW.type = 'id card' AND LENGTH(NEW.id_document) < 8 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ID card number must be at least 8 characters';
    END IF;
END;//
DELIMITER ;

-- 4. Trigger de mise à jour des sièges disponibles
DELIMITER //
CREATE TRIGGER update_available_seats AFTER INSERT ON booking
FOR EACH ROW
BEGIN
    UPDATE real_time rt
    SET rt.available_seat = rt.available_seat - NEW.seats
    WHERE rt.trip_id = NEW.trip_id;
END;//
DELIMITER ;

-- 5. Trigger d'audit de réservation
DELIMITER //
CREATE TRIGGER booking_modification_audit AFTER UPDATE ON booking
FOR EACH ROW
BEGIN
    INSERT INTO booking_audit (
        booking_id, 
        action_type, 
        user_id, 
        old_state, 
        new_state
    ) VALUES (
        NEW.book_id,
        'modify',
        (SELECT user_id FROM sessions LIMIT 1),
        JSON_OBJECT(
            'seats', OLD.seats,
            'status', OLD.status
        ),
        JSON_OBJECT(
            'seats', NEW.seats,
            'status', NEW.status
        )
    );
END;//
DELIMITER ;

-- 6. Trigger de mise à jour de statut de transaction
DELIMITER //
CREATE TRIGGER update_transaction_status AFTER INSERT ON transaction
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'completed' THEN
        UPDATE booking 
        SET status = 'confirmed' 
        WHERE book_id = NEW.book_id;
    END IF;
END;//
DELIMITER ;

-- 7. Trigger de log d'historique de transaction
DELIMITER //
CREATE TRIGGER transaction_history_log AFTER INSERT ON transaction
FOR EACH ROW
BEGIN
    INSERT INTO transaction_history (
        transaction_id, 
        type, 
        details
    ) VALUES (
        NEW.transaction_id,
        'created',
        JSON_OBJECT(
            'amount', NEW.amount,
            'method', NEW.method,
            'status', NEW.payment_status
        )
    );
END;//
DELIMITER ;

-- 8. Trigger de désactivation de promotion expirée
DELIMITER //
CREATE TRIGGER deactivate_expired_promo BEFORE UPDATE ON promo
FOR EACH ROW
BEGIN
    IF NEW.end_date < CURRENT_DATE THEN
        SET NEW.is_active = FALSE;
    END IF;
END;//
DELIMITER ;

-- 9. Trigger de limitation d'usage de promotion
DELIMITER //
CREATE TRIGGER check_promo_usage BEFORE INSERT ON transaction_parrainage
FOR EACH ROW
BEGIN
    DECLARE current_usage INT;
    SELECT current_usage INTO current_usage 
    FROM promo 
    WHERE promo_id = NEW.promotion_id;
    
    IF current_usage >= (SELECT max_usage FROM promo WHERE promo_id = NEW.promotion_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Promotion maximum usage reached';
    ELSE
        UPDATE promo 
        SET current_usage = current_usage + 1 
        WHERE promo_id = NEW.promotion_id;
    END IF;
END;//
DELIMITER ;

-- 10. Trigger de mise à jour dynamique du statut de voyage
DELIMITER //
CREATE TRIGGER update_trip_status BEFORE UPDATE ON trips
FOR EACH ROW
BEGIN
    IF NEW.departure_time < NOW() THEN
        SET NEW.status = 'ongoing';
    END IF;
END;//
DELIMITER ;

-- 11. Trigger de génération de ticket
DELIMITER //
CREATE TRIGGER generate_ticket AFTER INSERT ON booking
FOR EACH ROW
BEGIN
    INSERT INTO ticket (
        book_id, 
        status
    ) VALUES (
        NEW.book_id, 
        'pending'
    );
END;//
DELIMITER ;

-- 12. Trigger de vérification de capacité de bus
DELIMITER //
CREATE TRIGGER check_bus_capacity BEFORE INSERT ON booking
FOR EACH ROW
BEGIN
    DECLARE total_seats INT;
    DECLARE booked_seats INT;
    
    SELECT totalSeats INTO total_seats 
    FROM bus b
    JOIN trips t ON t.id_bus = b.id_bus
    WHERE t.trip_id = NEW.trip_id;
    
    SELECT COALESCE(SUM(seats), 0) INTO booked_seats
    FROM booking
    WHERE trip_id = NEW.trip_id;
    
    IF (booked_seats + NEW.seats) > total_seats THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bus capacity exceeded';
    END IF;
END;//
DELIMITER ;

-- 13. Trigger de suivi de parrainage
DELIMITER //
CREATE TRIGGER update_referral_stats AFTER INSERT ON transaction_parrainage
FOR EACH ROW
BEGIN
    UPDATE parrainage 
    SET 
        total_parrainee = total_parrainee + 1,
        total_gagne = total_gagne + NEW.bonus_amount
    WHERE user_id = NEW.user_id;
END;//
DELIMITER ;

-- 14. Trigger de notification de voyage
DELIMITER //
CREATE TRIGGER create_trip_notifications AFTER INSERT ON trips
FOR EACH ROW
BEGIN
    INSERT INTO notifications (
        trip_id, 
        message, 
        status, 
        scheduled
    ) VALUES (
        NEW.trip_id,
        CONCAT('Nouveau voyage de ', 
            (SELECT nom FROM garre g 
             JOIN agence a ON a.garre_id = g.garre_id 
             WHERE a.agence_id = NEW.id_agence_depart), 
            ' à ', 
            (SELECT nom FROM garre g 
             JOIN agence a ON a.garre_id = g.garre_id 
             WHERE a.agence_id = NEW.id_agence_dest)
        ),
        'waiting',
        NEW.departure_time
    );
END;//
DELIMITER ;

-- 15. Trigger de vérification de cohérence de route
DELIMITER //
CREATE TRIGGER validate_route_consistency BEFORE INSERT ON trips
FOR EACH ROW
BEGIN
    DECLARE depart_garre_ville VARCHAR(255);
    DECLARE dest_garre_ville VARCHAR(255);
    
    SELECT ville INTO depart_garre_ville
    FROM garre g
    JOIN agence a ON a.garre_id = g.garre_id
    WHERE a.agence_id = NEW.id_agence_depart;
    
    SELECT ville INTO dest_garre_ville
    FROM garre g
    JOIN agence a ON a.garre_id = g.garre_id
    WHERE a.agence_id = NEW.id_agence_dest;
    
    IF depart_garre_ville = dest_garre_ville THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Départ et arrivée dans la même ville non autorisé';
    END IF;
END;//
DELIMITER ;


//////////////////////////////////////////

-- Tables additionnelles pour améliorer la traçabilité et la gouvernance

-- Table de log système global
CREATE TABLE system_logs (
    log_id VARCHAR(255) PRIMARY KEY,
    log_type ENUM('security', 'performance', 'error', 'warning', 'info'),
    user_id VARCHAR(255),
    action_details JSON,
    ip_address VARCHAR(50),
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Table de scoring et réputation
CREATE TABLE user_reputation (
    reputation_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    total_trips INT DEFAULT 0,
    cancelled_trips INT DEFAULT 0,
    on_time_trips INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    last_rating_date TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Triggers Système

-- 1. Trigger de log système global
DELIMITER //
CREATE TRIGGER system_wide_logging AFTER INSERT OR UPDATE OR DELETE ON booking
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (
        log_type, 
        user_id, 
        action_details,
        ip_address
    ) VALUES (
        'info',
        (SELECT user_id FROM sessions WHERE session_id = CONNECTION_ID()),
        JSON_OBJECT(
            'table', 'booking',
            'action', TG_OP,
            'record_id', NEW.book_id
        ),
        (SELECT ip_adress FROM sessions WHERE session_id = CONNECTION_ID())
    );
END;//
DELIMITER ;

-- 2. Trigger de mise à jour de la réputation utilisateur
DELIMITER //
CREATE TRIGGER update_user_reputation AFTER UPDATE ON trips
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE user_reputation ur
        JOIN booking b ON b.trip_id = NEW.trip_id
        JOIN passengers p ON p.passenger_id = b.passenger_id
        JOIN users u ON u.user_id = p.user_id
        SET 
            ur.total_trips = ur.total_trips + 1,
            ur.on_time_trips = ur.on_time_trips + 1
        WHERE u.user_id = ur.user_id;
    END IF;
END;//
DELIMITER ;




//////////

CREATE VIEW trip_overview AS
SELECT 
    t.trip_id, 
    g1.nom AS departure_agency, 
    g2.nom AS destination_agency, 
    t.departure_time, 
    r.available_seat AS total_available_seats,
    COALESCE(SUM(b.seats), 0) AS booked_seats,
    (r.available_seat - COALESCE(SUM(b.seats), 0)) AS current_available_seats,
    dp.current_price AS price_per_seat,
    t.status
FROM trips t
JOIN garre g1 ON t.id_agence_depart = g1.garre_id
JOIN garre g2 ON t.id_agence_dest = g2.garre_id
LEFT JOIN booking b ON t.trip_id = b.trip_id AND b.status = 'confirmed'
JOIN real_time r ON t.trip_id = r.trip_id
LEFT JOIN dynamic_pricing dp ON t.trip_id = dp.trip_id
GROUP BY 
    t.trip_id, 
    g1.nom, 
    g2.nom, 
    t.departure_time, 
    r.available_seat, 
    dp.current_price, 
    t.status;

CREATE VIEW real_time_availability AS
SELECT 
    r.trip_id, 
    r.available_seat, 
    r.last_update, 
    r.reservation_lock, 
    r.reservation_complete,
    t.departure_time,
    g1.nom AS departure_agency,
    g2.nom AS destination_agency
FROM real_time r
JOIN trips t ON r.trip_id = t.trip_id
JOIN garre g1 ON t.id_agence_depart = g1.garre_id
JOIN garre g2 ON t.id_agence_dest = g2.garre_id;

CREATE VIEW vehicle_status AS
SELECT 
    v.id_bus AS vehicle_id, 
    v.model, 
    v.year, 
    v.plate, 
    bt.latitude, 
    bt.longitude, 
    bt.timestamp,
    t.trip_id,
    g1.nom AS departure_agency,
    g2.nom AS destination_agency
FROM bus v
JOIN bus_tracking bt ON v.id_bus = bt.trips_id
JOIN trips t ON bt.trips_id = t.trip_id
JOIN garre g1 ON t.id_agence_depart = g1.garre_id
JOIN garre g2 ON t.id_agence_dest = g2.garre_id;

CREATE VIEW notification_schedule AS
SELECT 
    n.notification_id, 
    n.trip_id, 
    t.departure_time,
    g1.nom AS departure_agency,
    g2.nom AS destination_agency,
    n.message, 
    n.status, 
    n.scheduled, 
    n.sent_at
FROM notifications n
JOIN trips t ON n.trip_id = t.trip_id
JOIN garre g1 ON t.id_agence_depart = g1.garre_id
JOIN garre g2 ON t.id_agence_dest = g2.garre_id;

CREATE VIEW payment_info AS
SELECT 
    t.transaction_id,
    t.book_id AS ticket_id, 
    t.method, 
    t.ref_number AS account_number, 
    u.full_name AS account_owner, 
    t.amount AS price, 
    t.payment_status,
    b.trip_id,
    g1.nom AS departure_agency,
    g2.nom AS destination_agency
FROM transaction t
JOIN booking b ON t.book_id = b.book_id
JOIN trips tr ON b.trip_id = tr.trip_id
JOIN garre g1 ON tr.id_agence_depart = g1.garre_id
JOIN garre g2 ON tr.id_agence_dest = g2.garre_id
JOIN users u ON b.passenger_id = u.user_id;