NotificationModel = Graviton.Model.extend({
  belongsTo: {
    user: {
      collectionName: 'users',
      field: 'userId'
    },
    post: {
      collectionName: 'posts',
      field: 'postId'
    }
  }
}, {
  commenterName: function() {
    return this.get('commenterName');
  },
  notificationPostPath: function() {
    return Router.routes.postPage.path({_id: this.get('postId')});
  },
  markAsRead: function() {
    this.update({$set: {read: true}});
  }
});

Notifications = Graviton.define('notifications', {
  modelCls: NotificationModel
});

createCommentNotification = function(comment) {
  var post = comment.post();
  if (comment.get('userId') !== post.get('userId')) {
    Notifications.create({
      userId: post.get('userId'),
      postId: post._id,
      commentId: comment._id,
      commenterName: comment.get('author'),
      read: false
    });
  }
};