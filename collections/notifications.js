Notifications = new Meteor.Collection('notifications');

Notifications.allow({
  update: ownsDocument
});

createCommentNotification = function(comment) {
  var post = comment.post();
  if (comment.get('userId') !== post.get('userId')) {
    Notifications.insert({
      userId: post.get('userId'),
      postId: post._id,
      commentId: comment._id,
      commenterName: comment.get('author'),
      read: false
    });
  }
};