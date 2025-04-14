import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';

const GET_BUSINESS_PROFILE = gql`
  query GetBusinessProfile($userId: ID!) {
    businessProfile(userId: $userId) {
      id
      name
      description
      location
      contactInfo
      images
      offers {
        id
        title
        description
        validUntil
        discount
        isActive
      }
      reviews {
        id
        author
        rating
        comment
        sentiment
        createdAt
      }
    }
  }
`;

const UPDATE_BUSINESS_PROFILE = gql`
  mutation UpdateBusinessProfile(
    $name: String!
    $description: String!
    $location: String!
    $contactInfo: String!
    $images: [String!]
  ) {
    updateBusinessProfile(
      input: {
        name: $name
        description: $description
        location: $location
        contactInfo: $contactInfo
        images: $images
      }
    ) {
      id
      name
      description
      location
      contactInfo
      images
    }
  }
`;

const ADD_BUSINESS_OFFER = gql`
  mutation AddBusinessOffer(
    $title: String!
    $description: String!
    $validUntil: String!
    $discount: Float!
  ) {
    addBusinessOffer(
      input: {
        title: $title
        description: $description
        validUntil: $validUntil
        discount: $discount
      }
    ) {
      id
      title
      description
      validUntil
      discount
      isActive
    }
  }
`;

const RESPOND_TO_REVIEW = gql`
  mutation RespondToReview($reviewId: ID!, $response: String!) {
    respondToReview(reviewId: $reviewId, response: $response) {
      id
      response
    }
  }
`;

const BusinessProfile = ({ me }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    contactInfo: '',
    images: []
  });
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    validUntil: '',
    discount: ''
  });

  const { loading, error, data, refetch } = useQuery(GET_BUSINESS_PROFILE, {
    variables: { userId: me?.id },
    skip: !me?.id,
    onCompleted: (data) => {
      if (data?.businessProfile) {
        setForm({
          name: data.businessProfile.name || '',
          description: data.businessProfile.description || '',
          location: data.businessProfile.location || '',
          contactInfo: data.businessProfile.contactInfo || '',
          images: data.businessProfile.images || []
        });
      }
    },
    onError: (error) => {
      console.error('Business Profile Error:', error);
    }
  });

  const [updateProfile] = useMutation(UPDATE_BUSINESS_PROFILE, {
    onCompleted: () => {
      setIsEditing(false);
      refetch();
    }
  });

  const [addOffer] = useMutation(ADD_BUSINESS_OFFER, {
    onCompleted: () => {
      setIsAddingOffer(false);
      refetch();
    }
  });

  const [respondToReview] = useMutation(RESPOND_TO_REVIEW);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload to a cloud storage service
      // For now, we'll use a local URL
      const imageUrl = URL.createObjectURL(file);
      setForm(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({
      variables: {
        ...form
      }
    });
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    await addOffer({
      variables: {
        ...offerForm,
        discount: parseFloat(offerForm.discount)
      }
    });
  };

  const handleReviewResponse = async (reviewId, response) => {
    await respondToReview({
      variables: {
        reviewId,
        response
      }
    });
  };

  if (!me?.id) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Business Profile</h1>
        <p className="text-gray-400">Please log in to view your business profile.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Business Profile</h1>
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-blue-400">Loading your profile...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Business Profile</h1>
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 mb-2">Error loading profile:</p>
          <p className="text-gray-300 text-sm">{error.message}</p>
          {!data?.businessProfile && (
            <p className="mt-4 text-gray-400 text-sm">
              It looks like you haven't set up your business profile yet. 
              Click the "Edit Profile" button below to get started.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            Edit Profile
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Business Profile</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </motion.button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg h-32"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Information</label>
              <input
                type="text"
                value={form.contactInfo}
                onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Images</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {form.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img src={image} alt="" className="w-24 h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }))}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">{form.name}</h2>
              <p className="text-gray-300">{form.description}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Location</h3>
              <p className="text-gray-300">{form.location}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Contact Information</h3>
              <p className="text-gray-300">{form.contactInfo}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Images</h3>
              <div className="flex flex-wrap gap-2">
                {form.images?.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Offers Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Special Offers</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingOffer(!isAddingOffer)}
              className="px-4 py-2 bg-green-600 rounded-lg"
            >
              {isAddingOffer ? 'Cancel' : 'Add Offer'}
            </motion.button>
          </div>

          {isAddingOffer && (
            <form onSubmit={handleAddOffer} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Offer Title</label>
                <input
                  type="text"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={offerForm.validUntil}
                    onChange={(e) => setOfferForm({ ...offerForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={offerForm.discount}
                    onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                Add Offer
              </button>
            </form>
          )}

          <div className="grid gap-4">
            {data?.businessProfile?.offers?.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{offer.title}</h3>
                    <p className="text-sm text-gray-300">{offer.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 text-lg font-bold">{offer.discount}% OFF</span>
                    <p className="text-xs text-gray-400">Valid until {new Date(offer.validUntil).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
          <div className="space-y-4">
            {data?.businessProfile?.reviews?.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{review.author}</span>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-500'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    review.sentiment === 'positive' ? 'bg-green-900 text-green-300' :
                    review.sentiment === 'negative' ? 'bg-red-900 text-red-300' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {review.sentiment}
                  </span>
                </div>
                <p className="text-gray-300">{review.comment}</p>
                {review.response ? (
                  <div className="mt-2 pl-4 border-l-2 border-blue-500">
                    <p className="text-sm text-blue-400">Your response:</p>
                    <p className="text-gray-300">{review.response}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const response = prompt('Enter your response to this review:');
                      if (response) {
                        handleReviewResponse(review.id, response);
                      }
                    }}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    Respond to review
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              src={selectedImage}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessProfile; 