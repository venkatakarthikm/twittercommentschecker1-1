import React, { useState } from 'react';
import axios from 'axios';
import './TwitterReplies.css'; // For your styling (you can add custom CSS here)

const TwitterReplies = () => {
  const [tweetIds, setTweetIds] = useState({ first: '', second: '' });
  const [replies, setReplies] = useState({ first: [], second: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFetched, setIsFetched] = useState(false); // State to control when data is fetched

  const fetchReplies = async (tweetId, continuationToken = '') => {
    const options = {
      method: 'GET',
      url: continuationToken
        ? 'https://twitter154.p.rapidapi.com/tweet/replies/continuation'
        : 'https://twitter154.p.rapidapi.com/tweet/replies',
      params: continuationToken
        ? { tweet_id: tweetId, continuation_token: continuationToken }
        : { tweet_id: tweetId },
      headers: {
        'x-rapidapi-key': '86c15bbc87msh2428de2b60ecbc1p1f4531jsn548df7bf80c7',
        'x-rapidapi-host': 'twitter154.p.rapidapi.com',
      },
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching replies');
    }
  };

  const handleFetch = async () => {
    if (!tweetIds.first || !tweetIds.second) return;
    setLoading(true);
    setError('');
    setIsFetched(false); // Hide the results until the fetch is completed

    try {
      const [firstReplies, secondReplies] = await Promise.all([
        fetchReplies(tweetIds.first),
        fetchReplies(tweetIds.second),
      ]);
      setReplies({ first: firstReplies.replies, second: secondReplies.replies });

      // If continuation token exists, fetch more replies until no continuation token is present
      let continuationToken = firstReplies.continuation_token;
      let allFirstReplies = firstReplies.replies;
      while (continuationToken) {
        const moreReplies = await fetchReplies(tweetIds.first, continuationToken);
        allFirstReplies = [...allFirstReplies, ...moreReplies.replies];
        continuationToken = moreReplies.continuation_token;
      }

      continuationToken = secondReplies.continuation_token;
      let allSecondReplies = secondReplies.replies;
      while (continuationToken) {
        const moreReplies = await fetchReplies(tweetIds.second, continuationToken);
        allSecondReplies = [...allSecondReplies, ...moreReplies.replies];
        continuationToken = moreReplies.continuation_token;
      }

      setReplies({
        first: allFirstReplies,
        second: allSecondReplies,
      });
      setIsFetched(true); // Mark that fetching is completed
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setTweetIds({ ...tweetIds, [e.target.name]: e.target.value });
  };

  const getUniqueUsernames = () => {
    const firstUsernames = new Set(replies.first.map(reply => reply.user.username));
    const secondUsernames = new Set(replies.second.map(reply => reply.user.username));

    // Find usernames that are in the first tweet but not in the second
    const uniqueFirstUsernames = [...firstUsernames].filter(username => !secondUsernames.has(username));

    return uniqueFirstUsernames;
  };

  const resetForm = () => {
    setTweetIds({ first: '', second: '' });
    setReplies({ first: [], second: [] });
    setError('');
    setIsFetched(false); // Reset the fetched state
  };

  return (
    <div className="container">
      <h1>Compare Twitter Replies</h1>

      {/* Form to enter Tweet IDs */}
      <div className="form-section">
        <input
          type="text"
          name="first"
          value={tweetIds.first}
          onChange={handleChange}
          placeholder="Enter First Tweet ID"
        />
        <input
          type="text"
          name="second"
          value={tweetIds.second}
          onChange={handleChange}
          placeholder="Enter Second Tweet ID"
        />
      </div>

      {/* Fetch button */}
      <div className="form-section">
        <button
          onClick={handleFetch}
          disabled={loading || !tweetIds.first || !tweetIds.second}
        >
          {loading ? 'Loading...' : 'Fetch Replies'}
        </button>
      </div>

      {/* Reset Button
      <div className="form-section">
        <button onClick={resetForm} disabled={loading}>
          Reset
        </button>
      </div> */}

      {/* Error Message */}
      {error && <p className="error">{error}</p>}

      {/* Show Results after fetching */}
      {isFetched && (
        <div className="results-section">
          <h2>Usernames in First Tweet but Not in Second Tweet</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Profile Picture</th>
                <th>Name</th>
                <th>Username</th>
                <th>Follower Count</th>
              </tr>
            </thead>
            <tbody>
              {getUniqueUsernames().map((username) => {
                const reply = replies.first.find((reply) => reply.user.username === username);
                return (
                  <tr key={username}>
                    <td>
                      <a
                        href={`https://x.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={reply.user.profile_pic_url}
                          alt={reply.user.username}
                          className="profile-pic"
                        />
                      </a>
                    </td>
                    <td>{reply.user.name}</td>
                    <td>{reply.user.username}</td>
                    <td>{reply.user.follower_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TwitterReplies;
