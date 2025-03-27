
// Remove the channelType prop from PostCard rendering
{posts.map((post) => (
  <PostCard key={post.id} post={post} />
))}

