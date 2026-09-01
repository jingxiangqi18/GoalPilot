CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    username VARCHAR(50) NOT NULL UNIQUE,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals(
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    goal_text VARCHAR(1000) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority VARCHAR(20),
    deadline DATETIME,
    success_criteria TEXT,
    constraint_text TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_goals_user
        FOREIGN KEY (user_id) REFERENCES users(id),

    INDEX idx_goals_user_created_at (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS goal_analyses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    goal_id BIGINT NOT NULL,

    version_number INT NOT NULL DEFAULT 1,

    goal_summary VARCHAR(1000) NOT NULL,

    known_information JSON NOT NULL,

    missing_information JSON NOT NULL,

    readiness VARCHAR(30) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_goal_analyses_goals
        FOREIGN KEY (goal_id) REFERENCES goals(id),

    CONSTRAINT uk_goal_analyses_goal_version
        UNIQUE (goal_id, version_number)
);

CREATE TABLE IF NOT EXISTS goal_clarification_questions(
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_id BIGINT NOT NULL,
    question_text VARCHAR(300) NOT NULL,
    sort_order INT NOT NULL,
    answer_text VARCHAR(1000),
    answered_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clarification_questions_analysis
        FOREIGN KEY (analysis_id) REFERENCES goal_analyses(id),

    CONSTRAINT uk_clarification_analysis_order
        UNIQUE (analysis_id, sort_order),

    CONSTRAINT uk_clarification_analysis_question
        UNIQUE (analysis_id, question_text)
);