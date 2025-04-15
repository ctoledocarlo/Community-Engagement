import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';

const GET_BUSINESS_LISTINGS = gql`
  query {
    myBusinessListings {
      id
      businessName
      description
      location
      phone
      email
      createdAt
    }
  }
`;

const CREATE_BUSINESS_LISTING = gql`
  mutation CreateBusinessListing(
    $businessName: String!
    $description: String
    $location: String
    $phone: String
    $email: String
  ) {
    createBusinessListing(
      businessName: $businessName
      description: $description
      location: $location
      phone: $phone
      email: $email
    ) {
      businessName
      description
      email
      location
    }
  }
`;

const BusinessListings = ({ me }) => {
  const { loading, error, data, refetch } = useQuery(GET_BUSINESS_LISTINGS);
  const [addListing] = useMutation(CREATE_BUSINESS_LISTING, {
    onCompleted: () => {
      alert('Business listing created!');
      refetch();
    },
  });

  const [form, setForm] = useState({
    businessName: '',
    description: '',
    location: '',
    phone: '',
    email: '',
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addListing({
      variables: form,
    });
    setForm({
      businessName: '',
      description: '',
      location: '',
      phone: '',
      email: '',
    });
  };

  if (loading)
    return <p className="text-white text-center mt-8">Loading...</p>;
  if (error)
    return <p className="text-red-500 text-center mt-8">Error loading listings.</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-6 bg-gray-800 rounded-2xl shadow-2xl text-white"
    >
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
        My Business Listings
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        {Object.keys(form).map((key) => (
          <input
            key={key}
            type="text"
            name={key}
            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
            value={form[key]}
            onChange={handleChange}
            className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}
        <button
          type="submit"
          className="md:col-span-2 mt-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-bold text-lg transition hover:scale-105 active:scale-95"
        >
          Add Listing
        </button>
      </form>

      <div className="space-y-4">
        {data.myBusinessListings.map((listing) => (
          <motion.div
            key={listing.id}
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gray-700 rounded-xl border border-gray-600 shadow-md"
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-1">
              {listing.businessName}
            </h2>
            <p className="text-sm text-gray-300 mb-2">{listing.description}</p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>
                <strong>Location:</strong> {listing.location || 'N/A'}
              </p>
              <p>
                <strong>Phone:</strong> {listing.phone || 'N/A'}
              </p>
              <p>
                <strong>Email:</strong> {listing.email || 'N/A'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BusinessListings;