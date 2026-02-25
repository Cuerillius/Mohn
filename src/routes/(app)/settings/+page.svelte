<script lang="ts">
	import AvatarMarble from '../../../components/AvatarMarble.svelte';

    export let data;
</script>

<div class="profile-grid">
    {#each data.userProfiles as profile}
        <a href="/profiles/{profile.id}/switch" class="profile-card">
            <div class="avatar-wrapper">
                <AvatarMarble name={profile.name} size={200} square={true} />
            </div>
            <span>{profile.name}</span>
        </a>
    {/each}

    <a href="/profiles/create" class="add-btn">+</a>
</div>