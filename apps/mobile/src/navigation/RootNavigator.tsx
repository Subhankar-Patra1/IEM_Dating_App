import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Text, View } from 'react-native';

const Stack = createNativeStackNavigator();

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { PhotoUploadScreen } from '../features/auth/screens/PhotoUploadScreen';
import { ChatScreen } from '../features/chat/screens/ChatScreen';
import { EditProfileScreen } from '../screens/main/EditProfileScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { EditGenderScreen } from '../screens/main/edit/EditGenderScreen';
import { EditSeekingScreen } from '../screens/main/edit/EditSeekingScreen';
import { EditCollegeScreen } from '../screens/main/edit/EditCollegeScreen';
import { EditDepartmentScreen } from '../screens/main/edit/EditDepartmentScreen';
import { EditBatchScreen } from '../screens/main/edit/EditBatchScreen';
import { EditCampusScreen } from '../screens/main/edit/EditCampusScreen';
import { EditDistanceScreen } from '../screens/main/edit/EditDistanceScreen';
import { EditAttendanceMoodScreen } from '../screens/main/edit/EditAttendanceMoodScreen';
import { EditBirthdayScreen } from '../screens/main/edit/EditBirthdayScreen';
import { EditOrientationScreen } from '../screens/main/edit/EditOrientationScreen';
import { EditSocialScreen } from '../screens/main/edit/EditSocialScreen';
import { EditLifestyleScreen } from '../screens/main/edit/EditLifestyleScreen';
import { EditPersonalityScreen } from '../screens/main/edit/EditPersonalityScreen';
import { EditInterestsScreen } from '../screens/main/edit/EditInterestsScreen';
import { EditBioScreen } from '../screens/main/edit/EditBioScreen';
import { EditHeightScreen } from '../screens/main/edit/EditHeightScreen';
import { EditResidencyScreen } from '../screens/main/edit/EditResidencyScreen';
import { EditYearScreen } from '../screens/main/edit/EditYearScreen';

const linking = {
  prefixes: ['http://localhost:8081', 'iemdating://'],
  config: {
    screens: {
      Auth: {
        path: '',
        screens: {
          Welcome: 'Welcome',
          Login: 'Login',
          SignUp: 'SignUp',
          LifestyleHabits: 'LifestyleHabits',
          CollegeSelection: 'CollegeSelection',
          BirthdaySelection: 'BirthdaySelection',
          GenderSelection: 'GenderSelection',
          OrientationSelection: 'OrientationSelection',
          NameSelection: 'NameSelection',
          SeekingSelection: 'SeekingSelection',
          DistancePreference: 'DistancePreference',
          HouseRules: 'HouseRules',
          PersonalityTraits: 'PersonalityTraits',
          Interests: 'Interests',
          ShareMore: 'ShareMore',
          FaceVerificationInfo: 'FaceVerificationInfo',
        }
      },
      Main: {
        path: 'main',
        screens: {
          Dashboard: 'Dashboard',
          Profile: 'Profile',
          Chats: 'Chats',
        }
      },
      PhotoUpload: 'PhotoUpload',
      ChatScreen: 'ChatScreen',
      EditProfile: 'EditProfile',
      EditGender: 'EditGender',
      EditSeeking: 'EditSeeking',
      EditCollege: 'EditCollege',
      EditDepartment: 'EditDepartment',
      EditBatch: 'EditBatch',
      EditCampus: 'EditCampus',
      EditDistance: 'EditDistance',
      EditAttendanceMood: 'EditAttendanceMood',
      EditBirthday: 'EditBirthday',
      EditOrientation: 'EditOrientation',
      EditSocial: 'EditSocial',
      EditLifestyle: 'EditLifestyle',
      EditPersonality: 'EditPersonality',
      EditInterests: 'EditInterests',
      EditBio: 'EditBio',
      EditHeight: 'EditHeight',
      EditResidency: 'EditResidency',
      EditYear: 'EditYear',
      Settings: 'Settings',
    }
  }
};

export const RootNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
        <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="EditGender" component={EditGenderScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditSeeking" component={EditSeekingScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditCollege" component={EditCollegeScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditDepartment" component={EditDepartmentScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditBatch" component={EditBatchScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditCampus" component={EditCampusScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditDistance" component={EditDistanceScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditAttendanceMood" component={EditAttendanceMoodScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditBirthday" component={EditBirthdayScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditOrientation" component={EditOrientationScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditSocial" component={EditSocialScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditLifestyle" component={EditLifestyleScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditPersonality" component={EditPersonalityScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditInterests" component={EditInterestsScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditBio" component={EditBioScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditHeight" component={EditHeightScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditResidency" component={EditResidencyScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="EditYear" component={EditYearScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

