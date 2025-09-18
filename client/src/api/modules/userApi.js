import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQueryWithReauth';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => ({
        url: `/profile/`,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    editProfile: builder.mutation({
      query: (data) => {
        const formData = new FormData();
        // Append only non-null values (optional)
        formData.append('full_name', data.full_name);
        formData.append('bio', data.bio);
        formData.append('phone', data.phone);
        formData.append('website', data.website);

        if (data.profile_image) formData.append('profile_image', data.profile_image);

        // ✅ Serialize arrays & objects explicitly
        if (Array.isArray(data.skills)) {
          formData.append('skills', JSON.stringify(data.skills));
        }
        if (Array.isArray(data.qualifications)) {
          formData.append('qualifications', JSON.stringify(data.qualifications));
        }

        return {
          url: '/profile/edit',
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: ['User'], 
    }),
  }),
});

export const { useGetProfileQuery, useEditProfileMutation } = userApi;