-- Create positions table for managing user positions/designations
-- This allows admins to manage available positions via CRUD

CREATE TABLE IF NOT EXISTS positions (
  position_id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  role_type ENUM('ADMIN', 'DEAN', 'FACULTY', 'ALL') DEFAULT 'ALL',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (position_id),
  UNIQUE KEY unique_position_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default positions
INSERT INTO positions (name, description, role_type, is_active) VALUES
('Administrator', 'System administrator', 'ADMIN', 1),
('Developer', 'Software developer', 'ADMIN', 1),
('IT Support', 'Technical support staff', 'ADMIN', 1),
('Dean', 'Head of college/department', 'DEAN', 1),
('Assistant Dean', 'Assistant to the dean', 'DEAN', 1),
('Secretary', 'Administrative secretary', 'DEAN', 1),
('Department Head', 'Head of department', 'DEAN', 1),
('Faculty Member', 'Teaching faculty', 'FACULTY', 1),
('Professor', 'Full professor', 'FACULTY', 1),
('Associate Professor', 'Associate professor', 'FACULTY', 1),
('Assistant Professor', 'Assistant professor', 'FACULTY', 1),
('Instructor', 'Instructor', 'FACULTY', 1),
('Program Coordinator', 'Program coordinator', 'FACULTY', 1),
('Research Coordinator', 'Research coordinator', 'FACULTY', 1);

-- Add index for faster queries
CREATE INDEX idx_positions_role_type ON positions(role_type);
CREATE INDEX idx_positions_is_active ON positions(is_active);

-- Show the table structure
DESCRIBE positions;

-- Verify the data
SELECT * FROM positions ORDER BY role_type, name;
