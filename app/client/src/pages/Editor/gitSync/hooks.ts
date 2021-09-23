import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback, useEffect } from "react";
import { generateSSHKeyPair, getSSHKeyPair } from "actions/applicationActions";
import { connectToGitInit } from "actions/gitSyncActions";
import { ConnectToGitPayload } from "api/GitSyncAPI";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";

export const useSSHKeyPair = () => {
  // As SSHKeyPair fetching and generation is only done only for GitConnection part,
  // All the state are maintained here instead of redux state.

  const dispatch = useDispatch();

  const currentApplication = useSelector(getCurrentApplication);

  const SSHKeyPair = currentApplication?.SSHKeyPair;
  const deployKeyDocUrl = currentApplication?.deployKeyDocUrl || DOCS_BASE_URL;

  const [generatingSSHKey, setIsGeneratingSSHKey] = useState(false);

  const [fetchingSSHKeyPair, setIsFetchingSSHKeyPair] = useState(false);

  const [failedGeneratingSSHKey, setFailedGeneratingSSHKey] = useState(false);

  useEffect(() => {
    // on change of sshKeyPair if it is defined, then stop the loading state.
    if (SSHKeyPair) {
      if (generatingSSHKey) setIsGeneratingSSHKey(false);
      if (fetchingSSHKeyPair) setIsFetchingSSHKeyPair(false);
    }
  }, [SSHKeyPair]);

  const fetchSSHKeyPair = useCallback(() => {
    setIsFetchingSSHKeyPair(true);
    dispatch(
      getSSHKeyPair({
        onErrorCallback: () => {
          setIsFetchingSSHKeyPair(false);
        },
      }),
    );
  }, [setIsFetchingSSHKeyPair]);

  const onGenerateSSHKeyFailure = useCallback(() => {
    setIsGeneratingSSHKey(false);
    setFailedGeneratingSSHKey(true);
  }, [setIsGeneratingSSHKey]);

  const generateSSHKey = useCallback(() => {
    if (currentApplication?.id) {
      setIsGeneratingSSHKey(true);
      setFailedGeneratingSSHKey(false);

      // Here after the ssh key pair generation, we fetch the application data again and on success of it
      dispatch(
        generateSSHKeyPair({
          onErrorCallback: onGenerateSSHKeyFailure,
        }),
      );
    }
  }, [onGenerateSSHKeyFailure, setIsGeneratingSSHKey, currentApplication?.id]);

  return {
    generatingSSHKey,
    failedGeneratingSSHKey,
    generateSSHKey,
    SSHKeyPair,
    deployKeyDocUrl,
    fetchSSHKeyPair,
    fetchingSSHKeyPair,
  };
};

export const useGitConnect = ({ onSuccess }: { onSuccess: () => void }) => {
  const dispatch = useDispatch();

  const [isConnectingToGit, setIsConnectingToGit] = useState(false);

  const [failedConnectingToGit, setFailedConnectingToGit] = useState(false);

  const onGitConnectSuccess = useCallback(() => {
    setIsConnectingToGit(false);

    onSuccess();
  }, [setIsConnectingToGit]);

  const onGitConnectFailure = useCallback(() => {
    setIsConnectingToGit(false);
    setFailedConnectingToGit(true);
  }, [setIsConnectingToGit]);

  const connectToGit = useCallback(
    (payload: ConnectToGitPayload) => {
      setIsConnectingToGit(true);
      setFailedConnectingToGit(false);

      // Here after the ssh key pair generation, we fetch the application data again and on success of it
      dispatch(
        connectToGitInit({
          payload,
          onSuccessCallback: onGitConnectSuccess,
          onErrorCallback: onGitConnectFailure,
        }),
      );
    },
    [onGitConnectSuccess, onGitConnectFailure, setIsConnectingToGit],
  );

  return {
    isConnectingToGit,
    failedConnectingToGit,
    connectToGit,
  };
};

export const useIsGitConnected = () => {
  // if remoteUrl is stored in gitApplicationMetaData it means application was connected to git successfully
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const remoteUrlInStore = gitMetaData?.remoteUrl;
  return !!remoteUrlInStore;
};
