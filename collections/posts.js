/**
 *
 * Post Model:
 *
 * post hasMany comments
 * there is a collection called 'comments' which has a key postId which references to it's owning post
 * on removal of a post the child comments should be removed
 *
 * post hasMany notifications
 * there is a collection called 'notifications' which has a key postId which references to it's owning post
 * on removal of a post the child notifications should be removed
 *
 */

PostModel = Graviton.Model.extend({
  hasMany: {
    comments: {
      collection: 'comments',
      foreignKey: 'postId', // comment.postId
      onRemove: 'cascade' //remove child comments when a post is removed
    },
    notifications: {
      collection: 'notifications',
      foreignKey: 'postId', // notification.postId
      onRemove: 'cascade' // remove child notifications when a post is removed
    }
  }
}, {

  // simple get aliases
  title: function() {
    return this.get('title');
  },
  url: function() {
    return this.get('url');
  },
  author: function() {
    return this.get('author');
  },
  votes: function() {
    return this.get('votes');
  },
  commentsCount: function() {
    return this.get('commentsCount');
  },

  // other model helpers
  ownPost: function() {
    return this.get('userId') == Meteor.userId();
  },

  // client specific functions
  domain: function() {
    if (Meteor.isClient) {
      var a = document.createElement('a');
      a.href = this.get('url');
      return a.hostname;
    }
  },
  upvotedClass: function() {
    var userId = Meteor.userId();
    if (userId && this.get('upvoters') && !_.include(this.get('upvoters'), userId)) {
      return 'btn-primary upvotable';
    } else {
      return 'disabled';
    }
  }
});

// Now that the model has been created, define the collection
Posts = Graviton.define('posts', {
  modelCls: PostModel
});

// Allow/deny rules
Posts.allow({
  update: ownsDocument,
  remove: ownsDocument
});

Posts.deny({
  update: function(userId, post, fieldNames) {
    // may only edit the following two fields:
    return (_.without(fieldNames, 'url', 'title').length > 0);
  }
});

// Meteor Methods related to this collection
Meteor.methods({
  post: function(postAttributes) {
    var user = Meteor.user(),
      postWithSameLink = Posts.findOne({url: postAttributes.url});
    
    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to post new stories");
    
    // ensure the post has a title
    if (!postAttributes.title)
      throw new Meteor.Error(422, 'Please fill in a headline');
    
    // check that there are no previous posts with the same link
    if (postAttributes.url && postWithSameLink) {
      throw new Meteor.Error(302, 
        'This link has already been posted', 
        postWithSameLink._id);
    }
    
    // pick out the whitelisted keys
    var post = _.extend(_.pick(postAttributes, 'url', 'title', 'message'), {
      userId: user._id, 
      author: user.username, 
      submitted: new Date().getTime(),
      commentsCount: 0,
      upvoters: [], votes: 0
    });

    //TODO: use model functions
    var postId = Posts.insert(post);
    
    return postId;
  },
  
  upvote: function(postId) {
    var user = Meteor.user();
    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to upvote");

    //TODO: use model functions
    Posts.update({
      _id: postId, 
      upvoters: {$ne: user._id}
    }, {
      $addToSet: {upvoters: user._id},
      $inc: {votes: 1}
    });
  }
});