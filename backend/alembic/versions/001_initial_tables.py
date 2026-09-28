"""Initial schema: users, jobs, applications tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-28 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('role', sa.Enum('worker', 'employer', name='user_role'), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('phone', sa.String(length=15), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('experience_years', sa.String(length=10), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('daily_wage', sa.Integer(), nullable=True),
        sa.Column('availability', sa.String(length=20), server_default='available', nullable=True),
        sa.Column('business_type', sa.String(length=50), nullable=True),
        sa.Column('company_name', sa.String(length=120), nullable=True),
        sa.Column('contact_person', sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_location'), 'users', ['location'], unique=False)
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # 2. Create jobs table
    op.create_table(
        'jobs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('employer_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=100), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('wage', sa.Integer(), nullable=False),
        sa.Column('wage_type', sa.String(length=20), server_default='per_day', nullable=False),
        sa.Column('workers_needed', sa.Integer(), server_default='1', nullable=False),
        sa.Column('duration_type', sa.String(length=20), server_default='one_day', nullable=False),
        sa.Column('contact_phone', sa.String(length=15), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('posted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employer_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index(op.f('ix_jobs_category'), 'jobs', ['category'], unique=False)
    op.create_index(op.f('ix_jobs_employer_id'), 'jobs', ['employer_id'], unique=False)
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)
    op.create_index(op.f('ix_jobs_is_active'), 'jobs', ['is_active'], unique=False)
    op.create_index(op.f('ix_jobs_location'), 'jobs', ['location'], unique=False)

    # 3. Create applications table
    op.create_table(
        'applications',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('job_id', sa.BigInteger(), nullable=False),
        sa.Column('worker_id', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.Enum('applied', 'viewed', 'shortlisted', 'selected', 'rejected', name='application_status'), server_default='applied', nullable=False),
        sa.Column('applied_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['worker_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_id', 'worker_id', name='uq_job_worker_application'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index(op.f('ix_applications_id'), 'applications', ['id'], unique=False)
    op.create_index(op.f('ix_applications_job_id'), 'applications', ['job_id'], unique=False)
    op.create_index(op.f('ix_applications_status'), 'applications', ['status'], unique=False)
    op.create_index(op.f('ix_applications_worker_id'), 'applications', ['worker_id'], unique=False)


def downgrade() -> None:
    op.drop_table('applications')
    op.drop_table('jobs')
    op.drop_table('users')
