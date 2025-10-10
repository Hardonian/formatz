#!/usr/bin/env node

/**
 * Quick script to create demo users via Supabase Auth API
 * Run: node create-demo-users.js
 */

const SUPABASE_URL = 'https://wpjoxxtknefrsioccwjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam94eHRrbmVmcnNpb2Njd2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTE4NTcsImV4cCI6MjA3NTUyNzg1N30.KJHcMxZaYLtHIc1ic4kxRij51YAJb4r-d6k0Lnni6zY';

const users = [
  { email: 'admin@4matz.com', password: 'Admin2025!' },
  { email: 'demo@4matz.com', password: 'Demo2025!' }
];

async function createUser(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email,
        password,
        options: {
          data: {
            display_name: email.includes('admin') ? 'Admin Demo' : 'Demo User'
          }
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Created user: ${email}`);
      return data;
    } else {
      console.log(`⚠️  User ${email}: ${data.error?.message || data.msg || 'Already exists or error'}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error creating ${email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating demo users for 4matz...\n');

  for (const user of users) {
    await createUser(user.email, user.password);
  }

  console.log('\n✅ Demo user creation complete!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@4matz.com / Admin2025!');
  console.log('Demo:  demo@4matz.com / Demo2025!');
}

main();
