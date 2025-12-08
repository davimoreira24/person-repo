-- Enable Realtime for the votes table
-- Run this SQL in your Supabase SQL Editor

-- Enable realtime for votes table
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- You can also enable for voting_sessions if needed
ALTER PUBLICATION supabase_realtime ADD TABLE voting_sessions;

-- Grant necessary permissions to anon role
GRANT SELECT ON votes TO anon;
GRANT SELECT ON voting_sessions TO anon;
GRANT INSERT, UPDATE ON votes TO anon;

