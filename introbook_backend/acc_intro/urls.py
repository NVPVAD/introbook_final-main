from django.urls import path, include
from .views import SignupView
from .views import login_view
from . import views
from .views import families_list
from .views import UserProfileView
from .views import SendOTP, VerifyOTP
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyViewSet
from .views import TestPublicView
from .views import EditProfileView
from .views import NewProfileListView
from .views import AllFamiliesView, FamilyMemberRegistrationView, FamilyMemberListView, FamilyMemberRemoveAccessView, FamilyMemberAvailableListView, ActivitiesView, FamilyMemberFamilyView, UserPermissionsView, FeaturedFamiliesView, SuggestedConnectionsView, ConnectFamilyView, CommunityActivitiesView, AcceptedConnectionsView, PendingRequestsView, FindConnectionsView, ConnectionResponseView, PrivateMessagesView, FamilyEventsView, FamilyEventDetailView, EventInvitationsView, EventResponseView, EventAttendeesView, FamilyUpdatesView, FamilyProfileView, SearchFamiliesView, DashboardStatsView, UserNumbersView, ForgotPasswordView, ResetPasswordView, MobileLoginOtpView, VerifyMobileOtpView, SetMobilePasswordView, TransformRelationView
from .excel_upload import UploadExcelView

router = DefaultRouter()
router.register(r'families', FamilyViewSet, basename='family')

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('send-otp/', SendOTP.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTP.as_view(), name='verify-otp'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('upload-excel/', UploadExcelView.as_view(), name='upload-excel'),
    path('mobile-login-otp/', MobileLoginOtpView.as_view(), name='mobile-login-otp'),
    path('verify-mobile-otp/', VerifyMobileOtpView.as_view(), name='verify-mobile-otp'),
    path('set-mobile-password/', SetMobilePasswordView.as_view(), name='set-mobile-password'),
    path('api/register/', views.register, name='register'),
    path('login/', login_view, name='login'),
    path('', include(router.urls)),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/edit/', EditProfileView.as_view(), name='edit-profile'),
    path('user-permissions/', UserPermissionsView.as_view(), name='user-permissions'),
    path('profile/new-list/', NewProfileListView.as_view(), name='new-profile-list'),
    path('all-families/', AllFamiliesView.as_view(), name='all-families'),
    path('family-members/', FamilyMemberListView.as_view(), name='family-members'),
    path('family-members/register/', FamilyMemberRegistrationView.as_view(), name='family-member-register'),
    path('family-members/<int:member_id>/remove-access/', FamilyMemberRemoveAccessView.as_view(), name='family-member-remove-access'),
    path('family-members/available/', FamilyMemberAvailableListView.as_view(), name='family-members-available'),
    path('activities/', ActivitiesView.as_view(), name='activities'),
    path('family-member/family/', FamilyMemberFamilyView.as_view(), name='family-member-family'),
    path('user-permissions/', UserPermissionsView.as_view(), name='user-permissions'),
    # Community endpoints
    path('community/featured-families/', FeaturedFamiliesView.as_view(), name='featured-families'),
    path('community/suggested-connections/', SuggestedConnectionsView.as_view(), name='suggested-connections'),
    path('community/connect/', ConnectFamilyView.as_view(), name='connect-family'),
    path('community/activities/', CommunityActivitiesView.as_view(), name='community-activities'),
    path('community/accepted-connections/', AcceptedConnectionsView.as_view(), name='accepted-connections'),
    path('community/pending-requests/', PendingRequestsView.as_view(), name='pending-requests'),
    path('community/find-connections/', FindConnectionsView.as_view(), name='find-connections'),
    path('community/connections/<int:connection_id>/respond/', ConnectionResponseView.as_view(), name='connection-response'),
    path('community/connections/<int:connection_id>/', ConnectionResponseView.as_view(), name='connection-delete'),
    path('community/search-families/', SearchFamiliesView.as_view(), name='search-families'),
    path('user-numbers/', UserNumbersView.as_view(), name='user-numbers'),
    # New post-connection features
    path('community/messages/', PrivateMessagesView.as_view(), name='private-messages'),
    path('community/events/', FamilyEventsView.as_view(), name='family-events'),
    path('community/events/<int:event_id>/', FamilyEventDetailView.as_view(), name='family-event-detail'),
    path('community/events/<int:event_id>/invitations/', EventInvitationsView.as_view(), name='event-invitations-list'),
    path('community/events/<int:event_id>/attendees/', EventAttendeesView.as_view(), name='event-attendees'),
    path('community/events/invite/', EventInvitationsView.as_view(), name='event-invitations'),
    path('community/events/invitations/', EventInvitationsView.as_view(), name='event-invitations-alt'),
    path('community/events/invitations/<int:invitation_id>/respond/', EventResponseView.as_view(), name='event-response'),
    path('community/events/invitations/<int:invitation_id>/', EventInvitationsView.as_view(), name='event-invitation-delete'),
    path('community/updates/', FamilyUpdatesView.as_view(), name='family-updates'),
    path('community/profile/<int:profile_id>/', FamilyProfileView.as_view(), name='family-profile'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('transform-relation/', TransformRelationView.as_view(), name='transform-relation'),

]

urlpatterns += [
    path('test-public/', TestPublicView.as_view()),
]
