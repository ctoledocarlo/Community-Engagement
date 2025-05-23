import CommunityPost from '../models/CommunityPost.js';
import HelpRequest from '../models/HelpRequest.js';
import { GraphQLError } from 'graphql';
import { graph, refreshEmbeddings } from "../basicGraph.js";
import { summarizePost } from '../utils/AIContentSummarization.js';

const resolvers = {
	Query: {
		authorized: (_, __, { user }) => {
			if (!user) {
				throw new GraphQLError('You must be logged in');
			}
			return true;
		},

		communityPosts: async (_, { category }) => {
			const filter = category ? { category } : {};
			const posts = await CommunityPost.find(filter);
		  
			const enrichedPosts = await Promise.all(
			  posts.map(async (post) => {
				if (
				  post.content.split(' ').length > 50 &&
				  !post.aiSummary
				) {
				  const summary = await summarizePost(post.content);
		  
				  if (summary) {
					post.aiSummary = summary;
					await post.save(); // persist it so next time it's already there
				  }
				}
		  
				return post;
			  })
			);
		  
			return enrichedPosts;
		},

		helpRequests: async (_, { isResolved }) => {
			const filter = isResolved !== undefined ? { isResolved } : {};
			return await HelpRequest.find(filter);
		},

		communityAIQuery: async (_, { question, sessionId }) => {
			console.log(`Question: ${question}`)

			try {
				const result = await graph.invoke({ question, sessionId });
				console.log("✅ Grah result:", result);
				return result
			  } catch (err) {
				console.error("❌ Graph failed:", err.stack);
				throw new GraphQLError('Error generating response: ' + err);
			}
		}
	},

	Mutation: {
		addCommunityPost: async (_, { title, content, category }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');
			console.log('Creating post with user:', user);
			const aiSummary = await summarizePost(content);

			const newPost = new CommunityPost({
				author: user.user._id,
				title,
				content,
				aiSummary,
				category
			});

			await newPost.save();
			await refreshEmbeddings();

			return newPost;
		},

		editCommunityPost: async (_, { id, title, content, category }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');

			const post = await CommunityPost.findById(id);
			if (!post) throw new GraphQLError('Post not found');
			
			console.log('Auth Check:', {
				postAuthor: post.author.toString(),
				userId: user.user._id,
				fullUser: user,
				match: post.author.toString() === user.user._id
			});

			if (post.author.toString() !== user.user._id) {
				throw new GraphQLError('Unauthorized');
			}

			if (title !== undefined) post.title = title;
			if (content !== undefined) post.content = content;
			if (category !== undefined) post.category = category;
			post.updatedAt = new Date();

			try {
				await post.save();
				await refreshEmbeddings();
				return true;
			} catch (error) {
				console.error('Error saving post:', error);
				throw new GraphQLError('Failed to update post');
			}
		},

		deleteCommunityPost: async (_, { id }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');

			const post = await CommunityPost.findById(id);
			if (!post) throw new GraphQLError('Post not found');
			
			console.log('Deleting post:', {
				postId: id,
				postAuthor: post.author,
				currentUser: user,
				userId: user.user._id
			});

			if (post.author.toString() !== user.user._id) {
				throw new GraphQLError('Unauthorized');
			}

			await post.deleteOne();
			await refreshEmbeddings();
			return true;
		},

		addHelpRequest: async (_, { title, description, location }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');
			
			const newRequest = new HelpRequest({
				author: user.user._id,
				title,
				description,
				location,
				volunteers: []
			});
			
			await newRequest.save();
			await refreshEmbeddings();

			return newRequest;
		},

		editHelpRequest: async (_, { id, title, description, location, isResolved }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');

			const request = await HelpRequest.findById(id);
			if (!request) throw new GraphQLError('Help request not found');
			if (request.author.toString() !== user.user._id) throw new GraphQLError('Unauthorized');

			if (title) request.title = title;
			if (description) request.description = description;
			if (location !== undefined) request.location = location;
			if (isResolved !== undefined) request.isResolved = isResolved;
			request.updatedAt = new Date();
			
			await request.save();
			await refreshEmbeddings();
			return true;
		},

		deleteHelpRequest: async (_, { id }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');

			const request = await HelpRequest.findById(id);
			if (!request) throw new GraphQLError('Help request not found');
			if (request.author.toString() !== user.user._id) throw new GraphQLError('Unauthorized');

			await request.deleteOne();
			await refreshEmbeddings();
			return true;
		},

		volunteer: async (_, { helpRequestId }, { user }) => {
			if (!user) throw new GraphQLError('You must be logged in');

			const request = await HelpRequest.findById(helpRequestId);
			if (!request) throw new GraphQLError('Help request not found');
			
			// Can't volunteer for your own request
			if (request.author.toString() === user.user._id) {
				throw new GraphQLError('Cannot volunteer for your own request');
			}

			// Check if already volunteered
			if (!request.volunteers.includes(user.user._id)) {
				request.volunteers.push(user.user._id);
				await refreshEmbeddings();
				await request.save();
			}

			return true;
		}
	}
};

export default resolvers;
