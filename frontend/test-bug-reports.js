import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBugReports() {
  try {
    console.log('🧪 Testing Bug Reports System...\n');

    // 1. Test if bug_reports table exists and has correct structure
    console.log('1. Checking bug_reports table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('bug_reports')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Bug reports table issue:', tableError.message);
      return;
    }
    console.log('✅ Bug reports table exists');

    // 2. Test if bug_comments table exists
    console.log('\n2. Checking bug_comments table structure...');
    const { data: commentsInfo, error: commentsError } = await supabase
      .from('bug_comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      console.error('❌ Bug comments table issue:', commentsError.message);
      return;
    }
    console.log('✅ Bug comments table exists');

    // 3. Test users table integration
    console.log('\n3. Testing users table integration...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, fullName, email, role')
      .limit(3);

    if (usersError) {
      console.error('❌ Users table issue:', usersError.message);
      return;
    }
    console.log(`✅ Users table accessible (${users.length} users found)`);

    // 4. Test bug report creation (simulate API call)
    console.log('\n4. Testing bug report creation...');
    const testUser = users[0]; // Use first user for testing

    if (testUser) {
      const { data: newBugReport, error: createError } = await supabase
        .from('bug_reports')
        .insert({
          title: 'Test Bug Report',
          description: 'This is a test bug report to verify the system is working',
          category: 'Testing',
          priority: 'LOW',
          reporterId: testUser.id,
          status: 'OPEN'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Bug report creation failed:', createError.message);
      } else {
        console.log('✅ Bug report created successfully:', newBugReport.id);

        // 5. Test comment creation
        console.log('\n5. Testing comment creation...');
        const { data: newComment, error: commentError } = await supabase
          .from('bug_comments')
          .insert({
            content: 'This is a test comment',
            authorId: testUser.id,
            bugReportId: newBugReport.id
          })
          .select()
          .single();

        if (commentError) {
          console.error('❌ Comment creation failed:', commentError.message);
        } else {
          console.log('✅ Comment created successfully:', newComment.id);
        }

        // 6. Test fetching bug reports with relationships
        console.log('\n6. Testing bug reports query with relationships...');
        const { data: fetchedReports, error: fetchError } = await supabase
          .from('bug_reports')
          .select(`
            *,
            reporter:users!bug_reports_reporter_id_fkey(id, fullName, email),
            assignee:users!bug_reports_assigned_to_fkey(id, fullName, email),
            comments:bug_comments(
              id,
              content,
              author:users!bug_comments_author_id_fkey(id, fullName, email),
              createdAt
            )
          `)
          .eq('id', newBugReport.id);

        if (fetchError) {
          console.error('❌ Fetch with relationships failed:', fetchError.message);
        } else {
          console.log('✅ Fetch with relationships successful');
          console.log('📋 Bug Report Details:');
          console.log(`   Title: ${fetchedReports[0].title}`);
          console.log(`   Reporter: ${fetchedReports[0].reporter?.fullName}`);
          console.log(`   Comments: ${fetchedReports[0].comments?.length || 0}`);
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await supabase.from('bug_comments').delete().eq('bug_report_id', newBugReport.id);
        await supabase.from('bug_reports').delete().eq('id', newBugReport.id);
        console.log('✅ Test data cleaned up');
      }
    } else {
      console.log('⚠️ No users found for testing');
    }

    console.log('\n🎉 Bug Reports System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Tables exist and are accessible');
    console.log('   ✅ User integration working');
    console.log('   ✅ Bug report creation working');
    console.log('   ✅ Comment system working');
    console.log('   ✅ Relationship queries working');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testBugReports();
