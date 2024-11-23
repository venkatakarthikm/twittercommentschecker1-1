import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // CSS file for styling

const TwitterCommentsChecker = () => {
  const [postId, setPostId] = useState("");
  const [adminUsernames, setAdminUsernames] = useState([]);
  const [pinnedTweets, setPinnedTweets] = useState({});
  const [missingComments, setMissingComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Utility function to introduce delay (in milliseconds)
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Fetch usernames from the admin post with continuation tokens
  const fetchAdminUsernames = async () => {
    setLoading(true);
    setError(null);
    let usernames = [];
    let continuationToken = null;

    try {
      do {
        const options = {
          method: "GET",
          url: continuationToken
            ? "https://twitter154.p.rapidapi.com/tweet/replies/continuation"
            : "https://twitter154.p.rapidapi.com/tweet/replies",
          params: continuationToken
            ? { tweet_id: String(postId), continuation_token: continuationToken }
            : { tweet_id: String(postId) },
          headers: {
            "x-rapidapi-key":
              "c7c63a7e97msh7fc7236a304ba66p1ab8bajsn727310125f47", // Replace with your RapidAPI key
            "x-rapidapi-host": "twitter154.p.rapidapi.com",
          },
        };

        const response = await axios.request(options);

        if (response.data && response.data.replies) {
          const fetchedUsernames = response.data.replies.map(
            (reply) => reply.user.username
          );
          usernames = [...usernames, ...fetchedUsernames];
        }

        continuationToken = response.data.continuation_token || null;

        // Introduce a delay to respect API rate limits
        if (continuationToken) {
          await delay(2000); // 2-second delay; adjust as needed
        }
      } while (continuationToken);

      setAdminUsernames(usernames);
    } catch (err) {
      console.error("Error fetching usernames:", err);
      setError(
        "Failed to fetch usernames. Please check the post ID or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch pinned tweet ID for each username
  const fetchPinnedTweetId = async (username) => {
    try {
      const response = await axios.get(
        "https://twitter241.p.rapidapi.com/user",
        {
          params: { username },
          headers: {
            "x-rapidapi-key":
              "c7c63a7e97msh7fc7236a304ba66p1ab8bajsn727310125f47", // Replace with your RapidAPI key
            "x-rapidapi-host": "twitter241.p.rapidapi.com",
          },
        }
      );
      const pinnedTweetIds =
        response.data.result?.data?.user?.result?.legacy
          ?.pinned_tweet_ids_str || [];
      const pinnedTweetId = pinnedTweetIds[0] || null;
      return pinnedTweetId;
    } catch (err) {
      console.error(
        `Error fetching pinned tweet for ${username}:`,
        err.message
      );
      return null;
    }
  };

  // Fetch usernames from a pinned post to compare with admin list
  const fetchUsernamesFromPinned = async (pinnedTweetId) => {
    try {
      const response = await axios.get(
        "https://twitter154.p.rapidapi.com/tweet/replies",
        {
          params: { tweet_id: pinnedTweetId },
          headers: {
            "x-rapidapi-key":
              "c7c63a7e97msh7fc7236a304ba66p1ab8bajsn727310125f47", // Replace with your RapidAPI key
            "x-rapidapi-host": "twitter154.p.rapidapi.com",
          },
        }
      );
      return response.data.replies.map((reply) => reply.user.username);
    } catch (err) {
      console.error(
        `Error fetching usernames from pinned post:`,
        err.message
      );
      return [];
    }
  };

  // Handle fetching pinned tweet IDs and checking for missing comments
  const handleCheckComments = async () => {
    if (adminUsernames.length === 0) {
      setError("No admin usernames available to check.");
      return;
    }

    setLoading(true);
    setError(null);
    const fetchedPinnedTweets = {};
    const missingCommentsData = {};

    try {
      for (const username of adminUsernames) {
        const pinnedTweetId = await fetchPinnedTweetId(username);
        if (pinnedTweetId) {
          fetchedPinnedTweets[username] = pinnedTweetId;
          const usernamesOnPinned = await fetchUsernamesFromPinned(
            pinnedTweetId
          );
          const missing = adminUsernames.filter(
            (admin) => !usernamesOnPinned.includes(admin)
          );
          missingCommentsData[username] = missing.length
            ? missing
            : "No missing comments";
        } else {
          missingCommentsData[username] = "No pinned tweet found";
        }

        // Optional: Introduce a delay between API calls to respect rate limits
        await delay(1000); // 1-second delay; adjust as needed
      }

      setPinnedTweets(fetchedPinnedTweets);
      setMissingComments(missingCommentsData);
    } catch (err) {
      console.error("Error checking comments:", err);
      setError("An error occurred while checking comments.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Twitter Admin Tool</h1>

      {/* Form to input post ID and fetch usernames */}
      <div className="form-group">
        <input
          type="text"
          placeholder="Enter Post ID"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          className="input-field"
        />
        <button onClick={fetchAdminUsernames} className="btn" disabled={loading}>
          {loading ? "Loading..." : "Fetch Usernames"}
        </button>
      </div>

      {/* Display usernames */}
      <div className="usernames-section">
        <h2>Usernames from Post:</h2>
        {adminUsernames.length > 0 ? (
          <ul>
            {adminUsernames.map((username, index) => (
              <li key={index}>{username}</li>
            ))}
          </ul>
        ) : (
          <p>No usernames found.</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {/* Form to check comments */}
      <div className="check-comments-section">
        <h2>Check Missing Comments</h2>
        <button
          onClick={handleCheckComments}
          className="btn"
          disabled={loading || adminUsernames.length === 0}
        >
          {loading ? "Checking..." : "Check Comments"}
        </button>
      </div>

      {/* Display missing comments */}
      <div className="missing-comments-section">
        <h2>Missing Comments:</h2>
        {Object.keys(missingComments).length > 0 ? (
          <ul>
            {Object.entries(missingComments).map(
              ([username, missing], index) => (
                <li key={index}>
                  <strong>{username}:</strong>{" "}
                  {Array.isArray(missing)
                    ? missing.join(", ")
                    : missing}
                </li>
              )
            )}
          </ul>
        ) : (
          <p>No missing comments data available yet.</p>
        )}
      </div>

      {/* Loading animation */}
      {loading && <div className="spinner"></div>}
    </div>
  );
};

export default TwitterCommentsChecker;
