import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { getWallet, getWalletTransactions } from '../../api/authAPI';

type MyWalletScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'MyWallet'>;

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
}

const { width } = Dimensions.get('window');

const MyWalletScreen = ({ navigation }: { navigation: MyWalletScreenNavigationProp }) => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWalletData = useCallback(async () => {
        try {
            const [walletData, transactionsData] = await Promise.all([
                getWallet(),
                getWalletTransactions(),
            ]);
            setBalance(walletData.balance);
            setTransactions(transactionsData);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchWalletData();
    }, [fetchWalletData]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#6366f1" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
                }
            >
                {/* Wallet Balance Card */}
                <LinearGradient
                    colors={['#fe7009', '#fe7009', '#fd3a69']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.balanceCardContent}>
                        <View style={styles.balanceHeader}>
                            <FontAwesome name="credit-card" size={32} color="white" />
                            <MaterialIcons name="account-balance-wallet" size={24} color="rgba(255,255,255,0.8)" />
                        </View>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
                        <View style={styles.cardDecoration}>
                            <View style={styles.decorationCircle1} />
                            <View style={styles.decorationCircle2} />
                        </View>
                    </View>
                </LinearGradient>

            

                {/* Refer & Earn Banner */}
                <TouchableOpacity
                    style={styles.referBanner}
                    onPress={() => navigation.navigate('ReferAndEarn')}
                >
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.referBannerGradient}
                    >
                        <View style={styles.referBannerContent}>
                            <View style={styles.referBannerLeft}>
                                <FontAwesome name="users" size={28} color="white" />
                                <View style={styles.referBannerText}>
                                    <Text style={styles.referBannerTitle}>Refer & Earn ₹100</Text>
                                    <Text style={styles.referBannerSubtitle}>Invite friends and get rewards!</Text>
                                </View>
                            </View>
                            <FontAwesome name="chevron-right" size={20} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Transaction History */}
                <View style={styles.transactionSection}>
                    <View style={styles.transactionHeader}>
                        <Text style={styles.transactionTitle}>Recent Transactions</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.length === 0 ? (
                        <Text style={styles.noTransactionsText}>No transactions yet</Text>
                    ) : (
                        transactions.map((transaction) => (
                            <View key={transaction.id} style={styles.transactionItem}>
                                <View style={styles.transactionLeft}>
                                    <View
                                        style={[
                                            styles.transactionIcon,
                                            transaction.type === 'credit' ? styles.creditIcon : styles.debitIcon,
                                        ]}
                                    >
                                        <FontAwesome
                                            name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                                            size={16}
                                            color={transaction.type === 'credit' ? '#10b981' : '#ef4444'}
                                        />
                                    </View>
                                    <View style={styles.transactionDetails}>
                                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                                        <Text style={styles.transactionDate}>{transaction.date}</Text>
                                    </View>
                                </View>
                                <Text
                                    style={[
                                        styles.transactionAmount,
                                        transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount,
                                    ]}
                                >
                                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    balanceCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    balanceCardContent: {
        position: 'relative',
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    balanceAmount: {
        color: 'white',
        fontSize: 42,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cardDecoration: {
        position: 'absolute',
        right: -20,
        bottom: -20,
    },
    decorationCircle1: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
    },
    decorationCircle2: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
        top: 20,
        left: 20,
    },
    
    referBanner: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    referBannerGradient: {
        padding: 20,
    },
    referBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    referBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    referBannerText: {
        marginLeft: 16,
        flex: 1,
    },
    referBannerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    referBannerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    },
    transactionSection: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    transactionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    viewAllText: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '600',
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    creditIcon: {
        backgroundColor: '#d1fae5',
    },
    debitIcon: {
        backgroundColor: '#fee2e2',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    creditAmount: {
        color: '#10b981',
    },
    debitAmount: {
        color: '#ef4444',
    },
    noTransactionsText: {
        textAlign: 'center',
        color: '#9ca3af',
        padding: 20,
        fontStyle: 'italic',
    },
});

export default MyWalletScreen;
